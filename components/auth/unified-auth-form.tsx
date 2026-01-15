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
        throw new Error(result.error || "登录失败")
      }

      setSuccess("登录成功！正在跳转...")

      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/")
        }
      }, 1000)
    } catch (err: any) {
      setError(err.message || "登录失败，请重试")
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
      setError("两次输入的密码不一致")
      return
    }

    // 验证同意条款
    if (!agreeTerms) {
      setError("请阅读并同意服务条款")
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
        throw new Error(data.error || "注册失败")
      }

      setSuccess("注册成功！请查收验证邮件或直接登录")

      // 自动切换到登录 tab
      setTimeout(() => {
        setLoginEmail(registerEmail)
        setLoginPassword("")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "注册失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            登录
          </TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            注册
          </TabsTrigger>
        </TabsList>

        {/* 登录表单 */}
        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="login-email">邮箱地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
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
              <Label htmlFor="login-password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="请输入密码"
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
                  记住我
                </Label>
              </div>
              <Button variant="link" className="px-0 text-sm" type="button" disabled={isLoading}>
                忘记密码?
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
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>
        </TabsContent>

        {/* 注册表单 */}
        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="register-name">用户名</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-name"
                  type="text"
                  placeholder="请输入用户名"
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
              <Label htmlFor="register-email">邮箱地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
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
              <Label htmlFor="register-password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="至少 6 个字符"
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
              <Label htmlFor="confirm-password">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
              {confirmPassword && registerPassword !== confirmPassword && (
                <p className="text-xs text-red-500">密码不一致</p>
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
                我已阅读并同意{" "}
                <Button variant="link" className="px-0 h-auto text-sm" type="button">
                  服务条款
                </Button>{" "}
                和{" "}
                <Button variant="link" className="px-0 h-auto text-sm" type="button">
                  隐私政策
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
                  注册中...
                </>
              ) : (
                "注册"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
