"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils/format-date"
import { getAccessToken } from "@/components/auth/auth-provider"
import { Receipt, Loader2 } from "lucide-react"

interface Payment {
  id: string
  paymentId: string
  amount: number
  currency: string
  provider: "wechat" | "alipay" | "stripe" | "paypal"
  status: "pending" | "completed" | "failed" | "refunded"
  description: string
  createdAt: string
}

const providerLabels: Record<string, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
  stripe: "Stripe",
  paypal: "PayPal",
}

const statusLabels: Record<string, string> = {
  pending: "处理中",
  completed: "已完成",
  failed: "失败",
  refunded: "已退款",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/payment/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("获取支付记录失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: currency || "CNY",
    })
    return formatter.format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>支付记录</CardTitle>
        <CardDescription>查看您的所有交易记录</CardDescription>
      </CardHeader>

      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">暂无支付记录</p>
            <p className="text-sm text-muted-foreground mt-1">
              升级专业版后，支付记录将显示在这里
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.paymentId.slice(0, 16)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {providerLabels[payment.provider] || payment.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status]}>
                        {statusLabels[payment.status] || payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
