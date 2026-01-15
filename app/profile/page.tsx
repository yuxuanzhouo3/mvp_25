"use client"

import { ProfileInfo } from "@/components/profile/profile-info"
import { useT } from "@/lib/i18n"

export default function ProfilePage() {
  const t = useT()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.profile.title}</h1>
        <p className="text-muted-foreground">{t.profile.accountInfo}</p>
      </div>

      <ProfileInfo />
    </div>
  )
}
