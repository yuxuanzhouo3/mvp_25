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
import { useAuth } from "@/components/auth/auth-provider"
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

export function AccountSettings() {
  const { logout } = useAuth()

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
  const [language, setLanguage] = useState("zh-CN")
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
      setPasswordError("两次输入的密码不一致")
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
        throw new Error(data.error || "修改密码失败")
      }

      setPasswordSuccess("密码修改成功")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordSuccess("")
      }, 2000)
    } catch (err: any) {
      setPasswordError(err.message || "修改密码失败，请重试")
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
        throw new Error(data.error || "删除账户失败")
      }

      // 登出并跳转
      await logout()
      window.location.href = "/login"
    } catch (err: any) {
      console.error("删除账户失败:", err)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>账户设置</CardTitle>
        <CardDescription>管理您的账户安全和偏好设置</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 修改密码 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">修改密码</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            定期更换密码可以提高账户安全性
          </p>
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-2">
                更改密码
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>修改密码</DialogTitle>
                <DialogDescription>
                  请输入当前密码和新密码
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">当前密码</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="请输入当前密码"
                    disabled={passwordLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 6 个字符"
                    disabled={passwordLoading}
                  />
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">确认新密码</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
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
                  取消
                </Button>
                <Button onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存更改"
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
            <Label>语言偏好</Label>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-CN">简体中文</SelectItem>
              <SelectItem value="en-US">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 深色模式 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <div>
              <h4 className="font-medium">深色模式</h4>
              <p className="text-sm text-muted-foreground">
                切换应用外观主题
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
            <h4 className="font-medium">危险操作</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            删除账户后，所有数据将被永久删除且无法恢复
          </p>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full mt-2">
                删除账户
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  确认删除账户
                </DialogTitle>
                <DialogDescription>
                  此操作不可撤销。删除后，您的所有数据（包括个人信息、订阅记录、支付记录等）将被永久删除。
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Label htmlFor="delete-confirm">
                  请输入 <strong>DELETE</strong> 确认删除
                </Label>
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
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      删除中...
                    </>
                  ) : (
                    "确认删除"
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
