"use client"

import { AccountSettings } from "@/components/profile/account-settings"
import { useT } from "@/lib/i18n"

export default function SettingsPage() {
  const t = useT()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.profile.settings}</h1>
        <p className="text-muted-foreground">{t.profile.notifications}</p>
      </div>

      <AccountSettings />
    </div>
  )
}
