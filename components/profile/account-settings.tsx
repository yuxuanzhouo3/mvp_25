"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { validatePassword } from "@/lib/utils/password-strength"
import {
  Lock,
  Globe,
  Moon,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react"
import { useT, useI18n } from "@/lib/i18n"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

export function AccountSettings() {
  const { logout } = useAuth()
  const t = useT()
  const { lang, setLanguage } = useI18n()

  // 修改密码状态
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // 删除账户状态
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 设置状态
  const [darkMode, setDarkMode] = useState(false)

  // 处理修改密码
  const handleChangePassword = async () => {
    setPasswordError("")
    setPasswordSuccess("")

    // 验证新密码
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      setPasswordError(validation.message)
      return
    }

    // 验证确认密码
    if (newPassword !== confirmPassword) {
      setPasswordError(t.settings.passwordMismatch)
      return
    }

    setPasswordLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.settings.passwordChangeFailed)
      }

      setPasswordSuccess(t.settings.passwordChangeSuccess)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordSuccess("")
      }, 2000)
    } catch (err: any) {
      setPasswordError(err.message || t.settings.passwordChangeFailed)
    } finally {
      setPasswordLoading(false)
    }
  }

  // 处理删除账户
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      return
    }

    setDeleteLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }

      // 登出并跳转
      await logout()
      window.location.href = "/login"
    } catch (err: any) {
      console.error("Failed to delete account:", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // 切换深色模式
  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // 切换语言
  const handleLanguageChange = (value: string) => {
    setLanguage(value as "en-US" | "zh-CN")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.title}</CardTitle>
        <CardDescription>{t.settings.manageSettings}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 修改密码 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">{t.settings.changePassword}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.settings.changePasswordDesc}
          </p>
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-2">
                {t.settings.changePasswordBtn}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.settings.changePasswordTitle}</DialogTitle>
                <DialogDescription>
                  {t.settings.changePasswordSubtitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t.settings.currentPassword}</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t.settings.currentPasswordPlaceholder}
                    disabled={passwordLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">{t.settings.newPassword}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.settings.newPasswordPlaceholder}
                    disabled={passwordLoading}
                  />
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">{t.settings.confirmNewPassword}</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.settings.confirmNewPasswordPlaceholder}
                    disabled={passwordLoading}
                  />
                </div>

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordDialog(false)}
                  disabled={passwordLoading}
                >
                  {t.common.cancel}
                </Button>
                <Button onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.settings.savingPassword}
                    </>
                  ) : (
                    t.profile.saveChanges
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* 语言设置 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label>{t.settings.languagePreference}</Label>
          </div>
          <Select value={lang} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-CN">{t.settings.chinese}</SelectItem>
              <SelectItem value="en-US">{t.settings.english}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 深色模式 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <div>
              <h4 className="font-medium">{t.settings.darkMode}</h4>
              <p className="text-sm text-muted-foreground">
                {t.settings.darkModeDesc}
              </p>
            </div>
          </div>
          <Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
        </div>

        <Separator />

        {/* 删除账户 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            <h4 className="font-medium">{t.settings.dangerZone}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.settings.deleteAccountDesc}
          </p>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full mt-2">
                {t.settings.deleteAccount}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t.settings.confirmDeleteTitle}
                </DialogTitle>
                <DialogDescription>
                  {t.settings.confirmDeleteDesc}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Label htmlFor="delete-confirm" dangerouslySetInnerHTML={{ __html: t.settings.typeDeleteConfirm }} />
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2"
                  disabled={deleteLoading}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteLoading}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.settings.deleting}
                    </>
                  ) : (
                    t.settings.confirmDelete
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
