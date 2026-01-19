# 使用官方 Node.js 轻量级镜像
FROM node:20-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci --legacy-peer-deps

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 这里的环境变量对于构建可能是必须的，如果有报错再调整
ENV NEXT_TELEMETRY_DISABLED 1

# 👇 新增这些行：设置假的 Key 来骗过构建检查
ENV OPENAI_API_KEY="sk-1234567890_dummy_key_for_build"
ENV NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy_anon_key_for_build"
ENV SUPABASE_SERVICE_ROLE_KEY="dummy_service_role_key_for_build"

# 开始构建
RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建系统用户（安全起见）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 自动分析构建产物，只复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 暴露端口，云托管通常默认 3000
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
