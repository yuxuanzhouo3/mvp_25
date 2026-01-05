# 智能备考系统 (MVP 25) - 项目分析报告

> 生成日期: 2025-12-31

---

## 1. 项目概述

本项目是一个**智能备考系统**，集成了技能评估、游戏化刷题、AI教练、错题管理等功能，旨在为用户提供个性化的学习体验。

### 技术栈概览

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端框架** | Next.js | 15.2.4 |
| **React** | React | 19 |
| **语言** | TypeScript | 5 |
| **UI组件库** | Radix UI | 40+ 组件 |
| **样式方案** | Tailwind CSS | 3.4 |
| **图表** | Recharts | 2.15 |
| **动画效果** | canvas-confetti | 1.9.4 |
| **后端云服务** | 腾讯云 CloudBase | - |
| **AI模型** | 阿里通义千问 (qwen-plus) | - |
| **表单处理** | React Hook Form + Zod | - |

---

## 2. 目录结构

```
mvp_25-main/
├── app/                              # Next.js 应用目录
│   ├── layout.tsx                    # 根布局
│   ├── page.tsx                      # 首页 (技能评估)
│   ├── globals.css                   # 全局样式
│   ├── api/                          # API 路由
│   │   ├── assessment/save/          # 保存评估结果
│   │   └── chat/                     # AI 对话相关
│   │       ├── analyze/              # AI 分析技能
│   │       ├── explain/              # 题目解析
│   │       └── history/              # 聊天历史
│   └── exam/                         # 备考模块
│       ├── page.tsx                  # 备考设置
│       ├── practice/page.tsx         # 刷题练习
│       └── review/page.tsx           # 错题复习
│
├── components/                       # React 组件库
│   ├── ui/                           # shadcn UI 基础组件 (50+)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   │
│   ├── 业务组件
│   │   ├── skill-assessment.tsx      # 技能评估
│   │   ├── role-classification.tsx   # 角色分类
│   │   ├── competitiveness-report.tsx # 竞争力报告
│   │   ├── learning-path-generator.tsx # 学习路径
│   │   ├── ai-coach-modal.tsx        # AI 教练
│   │   └── ...
│   │
│   └── exam/                         # 备考组件
│       ├── PracticeArena.tsx         # 刷题竞技场 (核心)
│       ├── QuestionCard.tsx          # 题目卡片
│       ├── AnswerFeedback.tsx        # 答题反馈
│       ├── RankPanel.tsx             # 等级面板
│       ├── WrongBook.tsx             # 错题本
│       ├── PracticeComplete.tsx      # 完成页面
│       ├── DemotionWarning.tsx       # 降级警告
│       └── FollowUpChat.tsx          # 追问对话
│
├── lib/                              # 工具库
│   ├── exam-mock-data.ts             # 题库数据和核心逻辑
│   ├── cloudbase.ts                  # 腾讯云初始化
│   ├── auth-mock.ts                  # 模拟认证
│   └── utils.ts                      # 工具函数
│
├── hooks/                            # 自定义 Hooks
│   ├── use-mobile.tsx                # 响应式检测
│   └── use-toast.ts                  # Toast 通知
│
├── public/                           # 静态资源
│
└── 配置文件
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    └── .env.local
```

---

## 3. 核心功能模块

### 3.1 技能评估系统 (`/`)

- **6 个技能类别**: 前端、后端、数据库、运维、数据科学、网络安全
- **30+ 技能项目**: 每个类别 6-8 个技能
- **滑块评分**: 0-10 分
- **实时保存**: CloudBase 云端存储

### 3.2 备考设置向导 (`/exam`)

**4 步引导流程**:
1. 目标设置 - 选择考试类型
2. 资料来源 - 上传文档或 AI 搜索
3. 处理中 - AI 生成题库
4. 准备完成 - 显示题目统计

### 3.3 刷题竞技场 (`/exam/practice`)

#### 等级系统 (5 级)

| 等级 | 积分范围 | 图标 |
|------|----------|------|
| 青铜 | 0 - 199 | 🥉 |
| 白银 | 200 - 499 | 🥈 |
| 黄金 | 500 - 999 | 🥇 |
| 铂金 | 1000 - 1999 | 💎 |
| 钻石 | 2000+ | 👑 |

#### 积分规则

| 情况 | 积分变化 |
|------|----------|
| 答对 | +10 (基础分) |
| 答错 | -5 (基础分) |
| 难度倍率 | 1x ~ 3x |
| 3 连击 | +5 |
| 5 连击 | +10 |
| 10 连击 | +20 |
| 20 连击 | +50 |

#### 降级警告机制

| 连续错误数 | 警告级别 |
|------------|----------|
| 4 题 | ⚠️ 黄色警告 |
| 6 题 | 🟠 橙色警告 |
| 7 题 | 🔴 直接降级 |

### 3.4 错题管理 (`/exam/review`)

- 自动记录错误题目
- 按知识点分类
- 标记已掌握/未掌握
- 支持重做和删除

### 3.5 AI 教练

- 个性化学习建议
- 实时对话式教学
- 职业方向分析
- 免费 3 次 / Premium 无限

---

## 4. 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
├─────────────────────────────────────────────────────────────┤
│  首页          │  备考设置      │  刷题竞技场    │  错题本    │
│  page.tsx      │  exam/page.tsx │  PracticeArena │  review    │
└────────┬───────┴───────┬────────┴───────┬────────┴────┬──────┘
         │               │                │             │
         ▼               ▼                ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                        状态管理层                            │
├─────────────────────────────────────────────────────────────┤
│  React useState      │  localStorage      │  CloudBase DB   │
│  - UI 状态           │  - rankState       │  - assessments  │
│  - 表单数据          │  - wrongQuestions  │  - users        │
│                      │  - currentIndex    │                 │
└────────┬─────────────┴────────┬──────────┴────────┬─────────┘
         │                      │                   │
         ▼                      ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        API 层                                │
├─────────────────────────────────────────────────────────────┤
│  /api/assessment/save    │  /api/chat/analyze   │  AI 模型  │
│  保存技能评估            │  AI 分析技能          │  通义千问 │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 关键组件说明

### 5.1 PracticeArena (刷题竞技场主组件)

**文件**: `components/exam/PracticeArena.tsx`

**核心状态**:
```typescript
- currentIndex: number        // 当前题目索引
- rankState: UserRankState    // 等级状态
- answerRecords: AnswerRecord[] // 答题记录
- wrongQuestions: WrongQuestion[] // 错题本
- showFeedback: boolean       // 显示反馈弹窗
- showWarning: boolean        // 显示警告弹窗
- warningLevel: 1 | 2 | 3     // 警告级别
- warningConsecutiveWrong: number // 连续错误数
```

**关键方法**:
- `handleAnswer()` - 处理答题逻辑
- `handleAddToWrongBook()` - 添加到错题本
- `handleNext()` - 下一题
- `saveToStorage()` - 持久化数据

### 5.2 AnswerFeedback (答题反馈)

**文件**: `components/exam/AnswerFeedback.tsx`

**显示内容**:
- 正确/错误状态
- 答案解析
- 积分变化
- 连击计数
- 操作按钮 (追问/加入错题本/下一题)

**特殊处理**:
- 最后一题显示"完成答题"
- 已添加错题显示"已加入错题本"

### 5.3 DemotionWarning (降级警告)

**文件**: `components/exam/DemotionWarning.tsx`

**警告类型**:
- Level 1: 黄色注意 (连续 4 错)
- Level 2: 橙色警告 (连续 6 错)
- Level 3: 红色降级 (连续 7 错)
- 作弊检测: 红色警告

---

## 6. 配置说明

### 6.1 环境变量 (.env.local)

```bash
# 腾讯云 CloudBase
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloud1-xxxxx
CLOUDBASE_SECRET_ID=AKIDxxxxx
CLOUDBASE_SECRET_KEY=xxxxx

# AI 模型 (阿里通义千问)
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL_NAME=qwen-plus

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2 Tailwind 主题配置

**主要颜色变量**:
- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--card` / `--card-foreground`
- `--destructive` / `--muted` / `--accent`

**设计风格**:
- 深蓝渐变背景 (slate-900 → blue-900)
- 深色模式优先
- 响应式断点 (sm/md/lg/xl)

---

## 7. 项目统计

| 指标 | 数值 |
|------|------|
| 总代码行数 | ~12,000+ 行 |
| TypeScript/TSX 文件 | 89 个 |
| UI 基础组件 | 50+ 个 |
| 业务组件 | 20+ 个 |
| API 路由 | 5 个 |
| 页面路由 | 5 个 |

---

## 8. 已完成功能

- [x] 技能评估系统 (6 类别 30+ 技能)
- [x] 角色自动分类
- [x] 竞争力分析报告
- [x] 备考设置向导
- [x] 刷题竞技场
- [x] 5 级等级系统
- [x] 积分和连击机制
- [x] 降级警告系统
- [x] 错题本管理
- [x] 答题反馈弹窗
- [x] 完成页面 (撒花效果)
- [x] AI 教练对话
- [x] localStorage 持久化
- [x] CloudBase 云端存储

---

## 9. 待完善功能

- [ ] 真实题库数据接入
- [ ] 完整的用户认证系统
- [ ] 支付/订阅功能
- [ ] 文档上传解析
- [ ] AI 联网搜索考试大纲
- [ ] 社交分享功能
- [ ] 多语言支持
- [ ] 移动端 App

---

## 10. 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

---

## 11. 项目亮点

1. **现代化技术栈** - Next.js 15 + React 19 + TypeScript
2. **游戏化设计** - 完整的等级、连击、降级机制
3. **个性化学习** - 技能评估 → 角色分类 → 学习路径
4. **云端集成** - CloudBase 数据库 + 通义千问 AI
5. **用户体验** - 撒花动画、实时反馈、深色主题
6. **数据持久化** - localStorage + 云端双重保障
7. **防作弊机制** - 异常行为检测和警告

---

*此报告由 Claude 自动生成*
