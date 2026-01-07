"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UnifiedAuthForm } from "@/components/auth/unified-auth-form"
import { WechatLoginButton } from "@/components/auth/wechat-login-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { isChinaRegion } from "@/lib/config/region"

// Logo 组件
function AppLogo() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6 text-white"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    </div>
  )
}

export default function LoginPage() {
  const [wechatError, setWechatError] = useState("")
  const isCN = isChinaRegion()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto">
            <AppLogo />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
            <CardDescription className="mt-1">
              登录您的 SkillMap 账户
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* 微信登录（仅国内版显示，放在表单外面避免触发表单验证） */}
          {isCN && (
            <div className="space-y-4">
              <WechatLoginButton
                onError={(error) => setWechatError(error)}
                onSuccess={() => {
                  window.location.href = "/"
                }}
              />

              {/* 微信登录错误提示 */}
              {wechatError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{wechatError}</AlertDescription>
                </Alert>
              )}

              {/* 分隔线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                    或使用邮箱登录
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 统一认证表单（登录 + 注册 Tabs） */}
          <UnifiedAuthForm defaultTab="login" />

          {/* 服务条款提示 */}
          <p className="text-xs text-center text-muted-foreground">
            登录即表示您同意我们的{" "}
            <a href="/terms" className="text-primary hover:underline">
              服务条款
            </a>{" "}
            和{" "}
            <a href="/privacy" className="text-primary hover:underline">
              隐私政策
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
