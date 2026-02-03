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
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"

// 检查是否为国际版
const isIntlRegion = !isChinaRegion()

interface UnifiedAuthFormProps {
  defaultTab?: "login" | "register"
  onSuccess?: () => void
  className?: string
}

// Google 图标 SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

// 国际版组件 - 支持邮箱密码、OTP、Google OAuth
function IntlAuthForm({ defaultTab = "login", onSuccess, className }: UnifiedAuthFormProps) {
  const router = useRouter()
  const { signInWithGoogle, signInWithPassword, signInWithOtp, verifyOtp, signUp, updatePassword } = useUserIntl()
  const t = useT()

  // 表单状态
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")

  // UI 状态
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password")
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  // 忘记密码状态
  const [forgotPassword, setForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"request" | "verify" | "reset">("request")
  const [resetOtp, setResetOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  // 通用状态
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // 重置忘记密码流程
  const resetForgotPasswordFlow = () => {
    setForgotPasswordStep("request")
    setResetOtp("")
    setNewPassword("")
    setConfirmNewPassword("")
  }

  // 处理邮箱密码登录
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await signInWithPassword(email, password)

      if (!result.success) {
        setError(result.error || t.auth.loginFailed)
        setIsLoading(false)
        return
      }

      setSuccess(t.auth.loginSuccess)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/dashboard")
        }
      }, 500)
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed)
      setIsLoading(false)
    }
  }

  // 处理 OTP 登录
  const handleOtpSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!otpSent) {
        // 发送验证码
        const result = await signInWithOtp(email)
        if (!result.success) {
          setError(result.error || t.auth.sendFailed)
        } else {
          setOtpSent(true)
          setSuccess(t.auth.verificationCodeSent)
        }
        setIsLoading(false)
      } else {
        // 验证验证码
        const result = await verifyOtp(email, otp)
        if (!result.success) {
          setError(result.error || t.auth.verificationFailed)
          setIsLoading(false)
        } else {
          setSuccess(t.auth.loginSuccess)
          setTimeout(() => {
            if (onSuccess) {
              onSuccess()
            } else {
              router.push("/dashboard")
            }
          }, 500)
        }
      }
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed)
      setIsLoading(false)
    }
  }

  // 处理注册
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError("")
    setSuccess("")

    // 验证密码
    if (password.length < 6) {
      setError(t.errors.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp(email, password)

      if (!result.success) {
        setError(result.error || t.auth.registerFailed)
        setIsLoading(false)
        return
      }

      setSuccess(t.auth.registrationSuccessCheckEmail)
      setPassword("")
      setConfirmPassword("")
      setIsLoading(false)
    } catch (err: any) {
      setError(err.message || t.auth.registerFailed)
      setIsLoading(false)
    }
  }

  // 处理 Google 登录
  const handleGoogleSignIn = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError("")

    try {
      await signInWithGoogle()
      // OAuth 会自动重定向
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed)
      setIsLoading(false)
    }
  }

  // 处理发送重置密码验证码
  const handleResetOtpRequest = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError("")

    try {
      const result = await signInWithOtp(email)
      if (!result.success) {
        setError(result.error || t.auth.sendFailed)
      } else {
        setForgotPasswordStep("verify")
        setSuccess(t.auth.verificationCodeSent)
      }
    } catch (err: any) {
      setError(err.message || t.auth.sendFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理验证重置密码验证码
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !resetOtp) return

    setIsLoading(true)
    setError("")

    try {
      const result = await verifyOtp(email, resetOtp)
      if (!result.success) {
        setError(result.error || t.auth.verificationFailed)
      } else {
        setForgotPasswordStep("reset")
        setSuccess(t.auth.verificationSuccessSetPassword)
      }
    } catch (err: any) {
      setError(err.message || t.auth.verificationFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理设置新密码
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    if (newPassword.length < 6) {
      setError(t.errors.passwordTooShort)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await updatePassword(newPassword)
      if (!result.success) {
        setError(result.error || t.auth.passwordUpdateFailed)
        return
      }

      setForgotPassword(false)
      resetForgotPasswordFlow()
      setPassword("")
      setOtp("")
      setOtpSent(false)
      setLoginMethod("password")
      setSuccess(t.auth.passwordResetSuccess)
    } catch (err: any) {
      setError(err.message || t.auth.passwordUpdateFailed)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取登录按钮文字
  const getSignInButtonText = () => {
    if (isLoading) {
      if (loginMethod === "password") return t.auth.loggingIn
      if (otpSent) return t.auth.verifying
      return t.auth.sending
    } else {
      if (loginMethod === "password") return t.auth.loginButton
      if (otpSent) return t.auth.verifyCode
      return t.auth.sendVerificationCode
    }
  }

  // 渲染忘记密码表单
  const renderForgotPasswordForm = () => {
    if (forgotPasswordStep === "request") {
      return (
        <form onSubmit={handleResetOtpRequest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t.auth.email}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.auth.sending}
              </>
            ) : (
              t.auth.sendVerificationCode
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              className="text-sm"
              type="button"
              onClick={() => {
                setForgotPassword(false)
                resetForgotPasswordFlow()
                setError("")
                setSuccess("")
              }}
            >
              {t.auth.backToLogin}
            </Button>
          </div>
        </form>
      )
    }

    if (forgotPasswordStep === "verify") {
      return (
        <form onSubmit={handleVerifyResetOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-otp">{t.auth.verificationCode}</Label>
            <Input
              id="reset-otp"
              type="text"
              placeholder={t.auth.verificationCodePlaceholder}
              value={resetOtp}
              onChange={(e) => setResetOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.auth.verifying}
              </>
            ) : (
              t.auth.verifyCode
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button
              variant="link"
              className="px-0"
              type="button"
              onClick={handleResetOtpRequest}
              disabled={isLoading}
            >
              {t.auth.resendCode}
            </Button>
            <Button
              variant="link"
              className="px-0"
              type="button"
              onClick={() => {
                setForgotPassword(false)
                resetForgotPasswordFlow()
                setError("")
                setSuccess("")
              }}
            >
              {t.auth.backToLogin}
            </Button>
          </div>
        </form>
      )
    }

    // reset step
    return (
      <form onSubmit={handleSetNewPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">{t.auth.newPassword}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder={t.auth.newPasswordPlaceholder}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">{t.auth.confirmPassword}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-new-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t.auth.confirmNewPasswordPlaceholder}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.auth.setting}
            </>
          ) : (
            t.auth.setNewPassword
          )}
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            className="text-sm"
            type="button"
            onClick={() => {
              setForgotPassword(false)
              resetForgotPasswordFlow()
              setError("")
              setSuccess("")
            }}
          >
            {t.auth.backToLogin}
          </Button>
        </div>
      </form>
    )
  }

  // 渲染登录表单
  const renderSignInForm = () => {
    if (forgotPassword) {
      return renderForgotPasswordForm()
    }

    return (
      <form
        onSubmit={loginMethod === "password" ? handleSignIn : handleOtpSignIn}
        className="space-y-4"
      >
        {/* 邮箱 */}
        <div className="space-y-2">
          <Label htmlFor="login-email">{t.auth.email}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder={t.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {loginMethod === "password" ? (
          <div className="space-y-2">
            <Label htmlFor="login-password">{t.auth.password}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="link"
                className="px-0 h-auto text-sm"
                type="button"
                onClick={() => {
                  setLoginMethod("otp")
                  setOtp("")
                  setOtpSent(false)
                  setError("")
                  setSuccess("")
                }}
              >
                {t.auth.useOtpLogin}
              </Button>
              <Button
                variant="link"
                className="px-0 h-auto text-sm"
                type="button"
                onClick={() => {
                  setForgotPassword(true)
                  resetForgotPasswordFlow()
                  setError("")
                  setSuccess("")
                }}
              >
                {t.auth.forgotPassword}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="login-otp">{t.auth.verificationCode}</Label>
            <Input
              id="login-otp"
              type="text"
              placeholder={t.auth.verificationCodePlaceholder}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required={otpSent}
              disabled={isLoading}
            />
            <div className="text-right">
              <Button
                variant="link"
                className="px-0 h-auto text-sm"
                type="button"
                onClick={() => {
                  setLoginMethod("password")
                  setOtp("")
                  setOtpSent(false)
                  setError("")
                  setSuccess("")
                }}
              >
                {t.auth.usePasswordLogin}
              </Button>
            </div>
          </div>
        )}

        {/* 登录按钮 */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {getSignInButtonText()}
            </>
          ) : (
            getSignInButtonText()
          )}
        </Button>
      </form>
    )
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

        {/* 登录 Tab */}
        <TabsContent value="login" className="space-y-6">
          {renderSignInForm()}

          {/* 分隔线 */}
          {!forgotPassword && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">
                    {t.common.or || "or"}
                  </span>
                </div>
              </div>

              {/* Google 登录 */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <GoogleIcon />
                {t.auth.loginWithGoogle}
              </Button>
            </>
          )}

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
        </TabsContent>

        {/* 注册 Tab */}
        <TabsContent value="register" className="space-y-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="register-email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? "text" : "password"}
                  placeholder={t.auth.passwordMinLength}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">{t.auth.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 隐私政策同意 */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="privacy-agree"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label
                htmlFor="privacy-agree"
                className="text-sm text-muted-foreground cursor-pointer flex-1"
              >
                {t.auth.iAgreeTo}{" "}
                <Button variant="link" className="px-0 h-auto text-sm" type="button">
                  {t.auth.privacyPolicy}
                </Button>{" "}
                {t.common.and}{" "}
                <Button variant="link" className="px-0 h-auto text-sm" type="button">
                  {t.auth.termsOfService}
                </Button>
              </label>
            </div>

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

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                {t.common.or || "or"}
              </span>
            </div>
          </div>

          {/* Google 注册 */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon />
            {t.auth.signUpWithGoogle}
          </Button>

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
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 国内版组件 - 使用邮箱密码登录
function CNAuthForm({ defaultTab = "login", onSuccess, className }: UnifiedAuthFormProps) {
  const router = useRouter()
  const { login } = useAuthCN()
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
          router.push("/dashboard")
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

// 导出统一的组件，根据区域自动选择
export function UnifiedAuthForm(props: UnifiedAuthFormProps) {
  if (isIntlRegion) {
    return <IntlAuthForm {...props} />
  }
  return <CNAuthForm {...props} />
}
