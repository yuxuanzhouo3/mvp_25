"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"
import { formatDate } from "@/lib/utils/format-date"
import { Loader2, CheckCircle, AlertCircle, Pencil, X } from "lucide-react"

export function ProfileInfo() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [displayName, setDisplayName] = useState(user?.displayName || "")

  const handleSave = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ displayName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "更新失败")
      }

      setSuccess("个人信息更新成功")
      setIsEditing(false)

      // 刷新页面以获取最新数据
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "更新失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName || "")
    setIsEditing(false)
    setError("")
  }

  // 获取头像首字母
  const getAvatarFallback = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>个人信息</CardTitle>
        <CardDescription>管理您的个人资料</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 头像区域 */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatar} alt={user?.displayName || "用户头像"} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getAvatarFallback()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" disabled>
              更换头像
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              支持 JPG、PNG 格式，最大 2MB
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
            <Label className="text-muted-foreground">用户名</Label>
            {isEditing ? (
              <div className="col-span-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="请输入用户名"
                  disabled={isLoading}
                />
              </div>
            ) : (
              <span className="col-span-2 font-medium">
                {user?.displayName || "未设置"}
              </span>
            )}
          </div>

          {/* 邮箱 */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-muted-foreground">邮箱</Label>
            <span className="col-span-2 font-medium">{user?.email || "未设置"}</span>
          </div>

          {/* 用户ID */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-muted-foreground">用户 ID</Label>
            <span className="col-span-2 text-sm font-mono text-muted-foreground">
              {user?.id || "未知"}
            </span>
          </div>

          {/* 注册时间 */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-muted-foreground">注册时间</Label>
            <span className="col-span-2 text-sm">
              {user?.createdAt ? formatDate(user.createdAt) : "未知"}
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
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    保存更改
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full">
              <Pencil className="mr-2 h-4 w-4" />
              编辑个人信息
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
