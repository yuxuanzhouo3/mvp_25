"use client"

import { SubscriptionCard } from "@/components/profile/subscription-card"
import { useT } from "@/lib/i18n"

export default function SubscriptionPage() {
  const t = useT()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.subscription.title}</h1>
        <p className="text-muted-foreground">{t.subscription.features}</p>
      </div>

      <SubscriptionCard />
    </div>
  )
}
