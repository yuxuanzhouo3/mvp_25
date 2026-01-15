"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { SidebarNavigation } from "@/components/profile/sidebar-navigation"
import { Loader2 } from "lucide-react"
import { useT } from "@/lib/i18n"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const t = useT()

  // 未登录重定向到登录页
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  // 未登录
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex h-screen">
        {/* 侧边栏 */}
        <SidebarNavigation />

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
            {/* 移动端顶部空间（给汉堡菜单留位置） */}
            <div className="h-12 md:hidden" />

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
