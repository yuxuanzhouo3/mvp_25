"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN, getAccessToken } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { formatDate } from "@/lib/utils/format-date"
import { Loader2, CheckCircle, AlertCircle, Pencil, X, Upload } from "lucide-react"
import { useT } from "@/lib/i18n"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

export function ProfileInfo() {
  const { user } = useAuth()
  const t = useT()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState(user?.name || "")

  // 处理头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t.profile.avatarFormatError)
      return
    }

    // 验证文件大小
    if (file.size > 2 * 1024 * 1024) {
      setError(t.profile.avatarSizeError)
      return
    }

    setError("")
    setIsUploadingAvatar(true)

    try {
      // 预览图片
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      // 上传头像
      const formData = new FormData()
      formData.append("avatar", file)

      const token = getAccessToken()
      const response = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.profile.uploadFailed)
      }

      setSuccess(t.profile.avatarUpdateSuccess)

      // 刷新页面以获取最新数据
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || t.profile.uploadFailed)
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = getAccessToken()
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.profile.updateFailed)
      }

      setSuccess(t.profile.profileUpdateSuccess)
      setIsEditing(false)

      // 刷新页面以获取最新数据
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || t.profile.updateFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.name || "")
    setIsEditing(false)
    setError("")
  }

  // 获取头像首字母
  const getAvatarFallback = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.personalInfo}</CardTitle>
        <CardDescription>{t.profile.manageProfile}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 头像区域 */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={avatarPreview || user?.avatar}
              alt={user?.name || t.profile.username}
            />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getAvatarFallback()}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.profile.uploading}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t.profile.changeAvatar}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              {t.profile.avatarFormats}
            </p>
          </div>
        </div>

        {/* 成功/错误提示 */}
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

        {/* 信息列表 */}
        <div className="space-y-4">
          {/* 用户名 */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-muted-foreground">{t.profile.username}</Label>
            {isEditing ? (
              <div className="col-span-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.profile.enterUsername}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <span className="col-span-2 font-medium">
                {user?.name || t.profile.notSet}
              </span>
            )}
          </div>

          {/* 邮箱 */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-muted-foreground">{t.profile.email}</Label>
            <span className="col-span-2 font-medium">{user?.email || t.profile.notSet}</span>
          </div>

          {/* 用户ID */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-muted-foreground">{t.profile.userId}</Label>
            <span className="col-span-2 text-sm font-mono text-muted-foreground">
              {user?.id || t.profile.unknown}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.profile.saving}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t.profile.saveChanges}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="mr-2 h-4 w-4" />
                {t.common.cancel}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full">
              <Pencil className="mr-2 h-4 w-4" />
              {t.profile.editPersonalInfo}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
