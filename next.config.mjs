/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    // 关键配置: 设置中间件的客户端最大请求体大小 (Next.js 16+)
    middlewareClientMaxBodySize: '500mb',
  },
  // 配置外部包,避免被打包
  serverExternalPackages: ['@cloudbase/node-sdk'],
}

export default nextConfig
