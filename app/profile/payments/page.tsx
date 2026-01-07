"use client"

import { PaymentHistory } from "@/components/profile/payment-history"

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支付记录</h1>
        <p className="text-muted-foreground">查看您的所有交易记录</p>
      </div>

      <PaymentHistory />
    </div>
  )
}
