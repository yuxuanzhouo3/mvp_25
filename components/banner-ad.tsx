"use client"

import { useState, useEffect } from "react"
import { Crown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useT } from "@/lib/i18n"
import { useIsIOSApp } from "@/hooks/use-is-ios-app"

interface BannerAdProps {
  onUpgrade: () => void
  position?: string // 广告位置，默认为 bottom
}

interface Advertisement {
  id: string
  title: string
  type: 'image' | 'video'
  position: string
  file_url: string
  file_url_cn?: string
  file_url_intl?: string
  link_url?: string
  redirect_url?: string
  priority: number
  status: string
  start_date?: string
  end_date?: string
}

export function BannerAd({ onUpgrade, position = 'bottom' }: BannerAdProps) {
  const t = useT()
  const isIOSApp = useIsIOSApp()
  const [isVisible, setIsVisible] = useState(true)
  const [dynamicAd, setDynamicAd] = useState<Advertisement | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 加载动态广告
  useEffect(() => {
    const loadDynamicAd = async () => {
      try {
        console.log(`📢 [BannerAd] Loading ads for position: ${position}`)
        const response = await fetch(`/api/ads/active?position=${position}&limit=1`)
        const data = await response.json()

        if (data.success && data.ads && data.ads.length > 0) {
          console.log(`✅ [BannerAd] Found dynamic ad:`, data.ads[0])
          setDynamicAd(data.ads[0])

          // 记录展示统计
          fetch(`/api/ads/${data.ads[0].id}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'impression' })
          }).catch(err => console.warn('Failed to track impression:', err))
        } else {
          console.log(`ℹ️ [BannerAd] No dynamic ads found, using default`)
          setDynamicAd(null)
        }
      } catch (err) {
        console.error(`❌ [BannerAd] Failed to load ads:`, err)
        setDynamicAd(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadDynamicAd()
  }, [position])

  // 检查 localStorage 中是否已关闭广告
  useEffect(() => {
    // 如果是动态广告，检查该广告是否被关闭
    const storageKey = dynamicAd
      ? `adClosed_${dynamicAd.id}`
      : "bannerAdClosed"

    const bannerClosed = localStorage.getItem(storageKey)
    if (bannerClosed === "true") {
      setIsVisible(false)
    }
  }, [dynamicAd])

  const handleClose = () => {
    setIsVisible(false)
    const storageKey = dynamicAd
      ? `adClosed_${dynamicAd.id}`
      : "bannerAdClosed"
    localStorage.setItem(storageKey, "true")
  }

  const handleAdClick = async () => {
    if (dynamicAd) {
      // 记录点击统计
      const linkUrl = dynamicAd.redirect_url || dynamicAd.link_url
      if (linkUrl) {
        fetch(`/api/ads/${dynamicAd.id}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'click' })
        }).catch(err => console.warn('Failed to track click:', err))

        // 打开链接
        window.open(linkUrl, '_blank')
      }
    } else {
      onUpgrade()
    }
  }

  // 加载中显示骨架屏
  if (isLoading) {
    return (
      <Card className="relative mb-8 overflow-hidden">
        <div className="h-[200px] bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      </Card>
    )
  }

  // 已关闭不显示
  if (!isVisible) {
    return null
  }

  // 显示动态广告
  if (dynamicAd) {
    return (
      <Card
        className="relative mb-8 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleAdClick}
      >
        <div className="relative">
          {/* 图片广告 */}
          {dynamicAd.type === 'image' && (
            <img
              src={dynamicAd.file_url}
              alt={dynamicAd.title}
              className="w-full h-auto object-cover"
              style={{ maxHeight: '200px' }}
            />
          )}

          {/* 视频广告 */}
          {dynamicAd.type === 'video' && (
            <video
              src={dynamicAd.file_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
              style={{ maxHeight: '200px' }}
            />
          )}

          {/* 关闭按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-900 flex-shrink-0"
            aria-label="Close ad"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* 广告标题（可选显示） */}
          {dynamicAd.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-sm font-medium">
                {dynamicAd.title}
              </p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // 显示默认硬编码广告
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
          {!isIOSApp && (
            <Button
              onClick={onUpgrade}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 whitespace-nowrap"
            >
              {t.banner.upgradeNow}
            </Button>
          )}
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
