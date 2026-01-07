"use client"

import { AccountSettings } from "@/components/profile/account-settings"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">账户设置</h1>
        <p className="text-muted-foreground">管理您的账户安全和偏好设置</p>
      </div>

      <AccountSettings />
    </div>
  )
}
