"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UnifiedAuthForm } from "@/components/auth/unified-auth-form"
import { WechatLoginButton } from "@/components/auth/wechat-login-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, Suspense } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { isChinaRegion } from "@/lib/config/region"
import { useSearchParams } from "next/navigation"
import { useT } from "@/lib/i18n"

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
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [wechatError, setWechatError] = useState("")
  const isCN = isChinaRegion()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const t = useT()

  // OAuth 错误消息映射
  const getOAuthErrorMessage = (error: string | null): string => {
    if (!error) return ""

    switch (error) {
      case 'missing_code':
        return t.oauthErrors.missingCode
      case 'callback_failed':
        return t.oauthErrors.callbackFailed
      case 'region_mismatch':
        return t.oauthErrors.regionMismatch
      case 'user_cancelled':
        return t.oauthErrors.userCancelled
      default:
        return error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto">
            <AppLogo />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t.auth.welcomeBack}</CardTitle>
            <CardDescription className="mt-1">
              {t.auth.loginToAccount}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* OAuth 错误提示（显示在最上方） */}
          {oauthError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{getOAuthErrorMessage(oauthError)}</AlertDescription>
            </Alert>
          )}

          {/* 微信登录（仅国内版显示） */}
          {isCN && (
            <div className="space-y-4">
              <WechatLoginButton
                onError={(error) => setWechatError(error)}
                onSuccess={() => {
                  window.location.href = "/dashboard"
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
                    {t.auth.orContinueWithEmail}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 统一认证表单（登录 + 注册 Tabs） */}
          <UnifiedAuthForm defaultTab="login" />
        </CardContent>
      </Card>
    </div>
  )
}
