"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils/format-date"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN, getAccessToken } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import {
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useT } from "@/lib/i18n"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

interface Subscription {
  id: string
  userId: string
  plan: "free" | "pro" | "premium"
  status: "active" | "expired" | "cancelled"
  startDate: string
  endDate: string
  autoRenew: boolean
}

export function SubscriptionCard() {
  const { user } = useAuth()
  const t = useT()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const planFeatures = [
    { name: t.subscription.dailyAssessments, free: `3${t.subscription.times}`, pro: t.subscription.unlimited },
    { name: t.subscription.aiConversations, free: `10${t.subscription.times}`, pro: t.subscription.unlimited },
    { name: t.subscription.advancedReports, free: false, pro: true },
    { name: t.subscription.personalizedPath, free: false, pro: true },
    { name: t.subscription.exportReports, free: false, pro: true },
    { name: t.subscription.prioritySupport, free: false, pro: true },
  ]

  useEffect(() => {
    if (isChinaRegion()) {
      fetchSubscription()
    } else {
      // For international version, read from user context
      if (user) {
        const hasActiveSub = user.subscription_status === "active"
        const expiresAt = user.membership_expires_at

        setSubscription(hasActiveSub ? {
          id: user.id,
          userId: user.id,
          plan: "pro",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: expiresAt || new Date().toISOString(),
          autoRenew: false,
        } : null)
      }
      setIsLoading(false)
    }
  }, [user])

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
      console.error("Failed to fetch subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    // 跳转到升级页面或打开升级弹窗
    window.location.href = "/payment"
  }

  const handleRenew = () => {
    // 跳转到续费页面
    window.location.href = "/payment"
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
        <CardTitle>{t.subscription.subscriptionStatus}</CardTitle>
        <CardDescription>{t.subscription.managePlan}</CardDescription>
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
                  {isPro ? t.subscription.proPlan : t.subscription.freePlan}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription && isActive
                    ? `${t.subscription.validUntil} ${formatDate(subscription.endDate)}`
                    : t.subscription.noActiveSubscription
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
              {isActive ? t.subscription.activated : subscription ? t.subscription.expired : t.subscription.notSubscribed}
            </Badge>
          </div>

          {/* 自动续费提示 */}
          {subscription?.autoRenew && isActive && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {t.subscription.autoRenewEnabled}
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        {!isPro || !isActive ? (
          <Button
            onClick={handleUpgrade}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            <Crown className="mr-2 h-4 w-4" />
            {t.subscription.upgradeToPro}
          </Button>
        ) : (
          <Button
            onClick={handleRenew}
            variant="outline"
            className="w-full"
          >
            续费订阅
          </Button>
        )}

        <Separator />

        {/* 套餐权益对比 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{t.subscription.planBenefits}</h4>
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
              {t.subscription.upgradeProTip}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
