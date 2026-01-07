"use client"

import { ProfileInfo } from "@/components/profile/profile-info"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">个人中心</h1>
        <p className="text-muted-foreground">管理您的个人信息和账户设置</p>
      </div>

      <ProfileInfo />
    </div>
  )
}
