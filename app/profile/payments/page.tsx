"use client"

import { PaymentHistory } from "@/components/profile/payment-history"
import { useT } from "@/lib/i18n"

export default function PaymentsPage() {
  const t = useT()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.payment.history}</h1>
        <p className="text-muted-foreground">{t.payment.viewHistory}</p>
      </div>

      <PaymentHistory />
    </div>
  )
}
