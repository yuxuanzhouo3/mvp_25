"use client"

import { useState, useEffect } from "react"
import { Crown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useT } from "@/lib/i18n"

interface BannerAdProps {
  onUpgrade: () => void
}

export function BannerAd({ onUpgrade }: BannerAdProps) {
  const t = useT()
  const [isVisible, setIsVisible] = useState(true)

  // 检查 localStorage 中是否已关闭广告
  useEffect(() => {
    const bannerClosed = localStorage.getItem("bannerAdClosed")
    if (bannerClosed === "true") {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem("bannerAdClosed", "true")
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className="relative bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800 mb-8 overflow-hidden">
      <div className="flex items-center justify-between p-4 md:p-6">
        {/* 左侧内容 */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-1">
              {t.banner.upgradeTitle}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t.banner.upgradeDesc}
            </p>
          </div>
        </div>

        {/* 右侧按钮区域 */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            onClick={onUpgrade}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 whitespace-nowrap"
          >
            {t.banner.upgradeNow}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex-shrink-0"
            aria-label={t.banner.closeAd}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
