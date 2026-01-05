# 环境变量配置说明

## 必需的环境变量

请在项目根目录创建 `.env.local` 文件，并添加以下配置：

```env
# 阿里通义千问 API Key
OPENAI_API_KEY=your_dashscope_api_key_here

# AI 模型名称（可选，默认为 qwen-plus）
AI_MODEL_NAME=qwen-plus
```

## 如何获取 API Key

1. 访问阿里云 DashScope 控制台：https://dashscope.console.aliyun.com/
2. 登录/注册账号
3. 在"API-KEY管理"页面创建新的 API Key
4. 复制 API Key 并粘贴到 `.env.local` 文件中

## 注意事项

- `.env.local` 文件已在 `.gitignore` 中，不会被提交到 Git
- 修改环境变量后需要重启开发服务器
- 请妥善保管您的 API Key，不要泄露给他人
