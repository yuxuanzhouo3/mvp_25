"use client"

import { SubscriptionCard } from "@/components/profile/subscription-card"

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">订阅管理</h1>
        <p className="text-muted-foreground">管理您的订阅计划和权益</p>
      </div>

      <SubscriptionCard />
    </div>
  )
}
