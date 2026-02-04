"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Crown, Check, Brain, Target, Calendar, Star } from "lucide-react"
import { useT } from "@/lib/i18n"
import { useIsIOSApp } from "@/hooks/use-is-ios-app"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeSuccess: () => void
  currentRole: string
}

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess, currentRole }: UpgradeModalProps) {
  const router = useRouter()
  const t = useT()
  const isIOSApp = useIsIOSApp()

  const handleUpgrade = () => {
    // Determine region and redirect to appropriate payment page
    const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "CN"

    if (region === "CN") {
      // Chinese region - redirect to Chinese payment page
      router.push("/payment")
    } else {
      // International region - redirect to international payment page (Stripe/PayPal)
      router.push("/payment/intl")
    }

    onClose()
  }

  const freeFeatures = t.upgrade.freeFeatures as string[]

  const premiumFeatures = t.upgrade.premiumFeatures as string[]

  const pricingPlans = [
    {
      name: t.subscription.monthly,
      price: "¥29",
      period: t.subscription.perMonth,
      popular: false,
      savings: "",
    },
    {
      name: t.subscription.yearly,
      price: "¥299",
      period: t.subscription.perYear,
      popular: true,
      savings: t.subscription.savePercent.replace("{percent}", "17"),
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl text-neutral-950 dark:text-white">
            <Crown className="w-6 h-6 mr-2 text-amber-500" />
            {t.upgrade.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Value Proposition */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-2">{t.upgrade.subtitle}</h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">{currentRole}</span>
            </p>
          </div>

          {/* Feature Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-6">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-neutral-950 dark:text-white">{t.upgrade.freePlan}</h4>
                <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-2">¥0</div>
              </div>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 border-0">{t.upgrade.recommended}</Badge>
              </div>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-neutral-950 dark:text-white flex items-center justify-center">
                  <Crown className="w-4 h-4 mr-2 text-amber-500" />
                  {t.upgrade.premiumPlan}
                </h4>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{t.upgrade.startingPrice} ¥29</div>
              </div>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <Check className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-neutral-950 dark:text-white">
                    <Star className="w-4 h-4 mr-3 text-amber-500" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Premium Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-4">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">{t.upgrade.aiPathGen}</h4>
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">{t.upgrade.aiPathGenDesc}</p>
            </Card>

            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center mb-3">
                <Target className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">{t.upgrade.smartTracking}</h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{t.upgrade.smartTrackingDesc}</p>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">{t.upgrade.dailyPlan}</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">{t.upgrade.dailyPlanDesc}</p>
            </Card>
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-neutral-950 dark:text-white font-semibold">{t.upgrade.aiCoach}</h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{t.upgrade.aiCoachDesc}</p>
            </Card>
          </div>

          {/* Pricing Options */}
          <div>
            <h4 className="text-lg font-semibold text-neutral-950 dark:text-white text-center mb-4">{t.upgrade.selectPlan}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`p-4 cursor-pointer transition-all ${
                    plan.popular
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 scale-105"
                      : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {plan.popular && (
                    <div className="text-center mb-2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">{t.upgrade.mostPopular}</Badge>
                    </div>
                  )}
                  <div className="text-center">
                    <h5 className="text-neutral-950 dark:text-white font-semibold">{plan.name}</h5>
                    <div className="flex items-baseline justify-center mt-2">
                      <span className="text-2xl font-bold text-neutral-950 dark:text-white">{plan.price}</span>
                      <span className="text-neutral-500 dark:text-neutral-400 ml-1">{plan.period}</span>
                    </div>
                    {plan.savings && <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{plan.savings}</div>}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!isIOSApp && (
            <div className="text-center space-y-4">
              <Button
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-3 text-lg cursor-pointer"
              >
                <Crown className="w-5 h-5 mr-2" />
                {t.upgrade.upgradeNow}
              </Button>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.upgrade.guarantee}</div>
            </div>
          )}

          {/* Limited Time Offer */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <h4 className="text-red-700 dark:text-red-300 font-semibold mb-2">{t.upgrade.limitedOffer}</h4>
            <p className="text-sm text-red-600 dark:text-red-300">
              {t.upgrade.offerEnds}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
