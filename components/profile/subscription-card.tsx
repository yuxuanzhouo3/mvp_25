"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils/format-date"
import { useAuth, getAccessToken } from "@/components/auth/auth-provider"
import {
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react"

interface Subscription {
  id: string
  userId: string
  plan: "free" | "pro" | "premium"
  status: "active" | "expired" | "cancelled"
  startDate: string
  endDate: string
  autoRenew: boolean
}

interface PlanFeature {
  name: string
  free: string | boolean
  pro: string | boolean
}

const planFeatures: PlanFeature[] = [
  { name: "每日评估次数", free: "3次", pro: "无限" },
  { name: "AI 对话次数", free: "10次", pro: "无限" },
  { name: "高级分析报告", free: false, pro: true },
  { name: "个性化学习路径", free: false, pro: true },
  { name: "导出报告", free: false, pro: true },
  { name: "优先客服支持", free: false, pro: true },
]

export function SubscriptionCard() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("获取订阅信息失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    // 跳转到升级页面或打开升级弹窗
    window.location.href = "/upgrade"
  }

  const handleRenew = () => {
    // 跳转到续费页面
    window.location.href = "/upgrade?action=renew"
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

  const isPro = subscription?.plan === "pro" || subscription?.plan === "premium"
  const isActive = subscription?.status === "active"

  return (
    <Card>
      <CardHeader>
        <CardTitle>订阅状态</CardTitle>
        <CardDescription>管理您的订阅计划</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 当前套餐卡片 */}
        <div
          className={`p-4 rounded-lg border-2 ${
            isPro && isActive
              ? "bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-300 dark:border-purple-700"
              : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {isPro && isActive ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {isPro ? "专业版" : "免费版"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription && isActive
                    ? `有效期至: ${formatDate(subscription.endDate)}`
                    : "暂无有效订阅"
                  }
                </p>
              </div>
            </div>

            <Badge
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : ""
              }
            >
              {isActive ? "已激活" : subscription ? "已过期" : "未订阅"}
            </Badge>
          </div>

          {/* 自动续费提示 */}
          {subscription?.autoRenew && isActive && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              已开启自动续费
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        {!isPro || !isActive ? (
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Crown className="mr-2 h-4 w-4" />
            升级到专业版
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleRenew}>
              续费订阅
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
              取消订阅
            </Button>
          </div>
        )}

        <Separator />

        {/* 套餐权益对比 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">套餐权益</h4>
          <ul className="space-y-2 text-sm">
            {planFeatures.map((feature) => {
              const currentValue = isPro ? feature.pro : feature.free
              const hasFeature = currentValue !== false

              return (
                <li key={feature.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasFeature ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={!hasFeature ? "text-muted-foreground" : ""}>
                      {feature.name}
                    </span>
                  </div>
                  {typeof currentValue === "string" && (
                    <span className="text-muted-foreground text-xs">
                      {currentValue}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* 专业版优势提示 */}
        {!isPro && (
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              升级专业版，解锁全部功能，享受无限制的 AI 评估和个性化学习路径！
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
