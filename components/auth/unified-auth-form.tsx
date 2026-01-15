"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { validatePassword } from "@/lib/utils/password-strength"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

interface UnifiedAuthFormProps {
  defaultTab?: "login" | "register"
  onSuccess?: () => void
  className?: string
}

export function UnifiedAuthForm({ defaultTab = "login", onSuccess, className }: UnifiedAuthFormProps) {
  const router = useRouter()
  const { login } = useAuth()
  const t = useT()

  // 登录表单状态
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // 注册表单状态
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)

  // 通用状态
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const result = await login(loginEmail, loginPassword)

      if (!result.success) {
        throw new Error(result.error || t.auth.loginFailed)
      }

      setSuccess(t.auth.loginSuccess)

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/")
        }
      }, 1000)
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // 验证密码
    const passwordValidation = validatePassword(registerPassword)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message)
      return
    }

    // 验证密码确认
    if (registerPassword !== confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    // 验证同意条款
    if (!agreeTerms) {
      setError(t.auth.agreeTerms)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          confirmPassword: confirmPassword,
          name: registerName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.auth.registerFailed)
      }

      setSuccess(t.auth.registerSuccess)

      // 自动切换到登录 tab
      setTimeout(() => {
        setLoginEmail(registerEmail)
        setLoginPassword("")
      }, 2000)
    } catch (err: any) {
      setError(err.message || t.auth.registerFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t.common.login}
          </TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t.common.register}
          </TabsTrigger>
        </TabsList>

        {/* 登录表单 */}
        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="login-email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="login-password">{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 记住我 + 忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                  {t.auth.rememberMe}
                </Label>
              </div>
              <Button variant="link" className="px-0 text-sm" type="button" disabled={isLoading}>
                {t.auth.forgotPassword}
              </Button>
            </div>

            {/* 错误/成功提示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* 登录按钮 */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.auth.loggingIn}
                </>
              ) : (
                t.auth.loginButton
              )}
            </Button>
          </form>
        </TabsContent>

        {/* 注册表单 */}
        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="register-name">{t.auth.username}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-name"
                  type="text"
                  placeholder={t.auth.usernamePlaceholder}
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="register-email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="register-password">{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder={t.auth.passwordMinLength}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
              <PasswordStrengthIndicator password={registerPassword} />
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t.auth.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
              {confirmPassword && registerPassword !== confirmPassword && (
                <p className="text-xs text-red-500">{t.auth.passwordMismatch}</p>
              )}
            </div>

            {/* 同意条款 */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agree-terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <Label htmlFor="agree-terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                {t.auth.termsText}{" "}
                <Button variant="link" className="px-0 h-auto text-sm" type="button">
                  {t.auth.termsOfService}
                </Button>{" "}
                {t.common.and}{" "}
                <Button variant="link" className="px-0 h-auto text-sm" type="button">
                  {t.auth.privacyPolicy}
                </Button>
              </Label>
            </div>

            {/* 错误/成功提示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* 注册按钮 */}
            <Button type="submit" className="w-full" disabled={isLoading || !agreeTerms}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.auth.registering}
                </>
              ) : (
                t.auth.registerButton
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
