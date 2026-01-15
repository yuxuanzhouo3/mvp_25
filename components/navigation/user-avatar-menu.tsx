"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { useT } from "@/lib/i18n"
import {
  User,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

export function UserAvatarMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const t = useT()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 菜单项配置（使用翻译）
  const menuItems = [
    { title: t.userMenu.profile, icon: User, href: "/profile" },
    { title: t.userMenu.subscription, icon: CreditCard, href: "/profile/subscription" },
    { title: t.userMenu.payments, icon: Receipt, href: "/profile/payments" },
    { title: t.userMenu.settings, icon: Settings, href: "/profile/settings" },
  ]

  // 获取用户名首字母作为头像回退
  const getAvatarFallback = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  // 处理鼠标进入
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  // 处理鼠标离开（延迟关闭，避免移动到菜单时意外关闭）
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  // 处理退出登录
  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    router.push("/login")
  }

  // 处理菜单项点击
  const handleMenuItemClick = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 头像按钮 */}
      <button
        className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-indigo-500 dark:hover:ring-indigo-400 transition-all duration-200 focus:outline-none focus:ring-indigo-500 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="用户菜单"
      >
        <Avatar className="w-full h-full">
          <AvatarImage
            src={user?.avatar}
            alt={user?.name || "用户头像"}
          />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-medium">
            {getAvatarFallback()}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-950 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 用户信息头部 */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.name || "用户头像"}
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-medium">
                  {getAvatarFallback()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-950 dark:text-white truncate">
                  {user?.name || "用户"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user?.email}
                </p>
                {user?.pro && (
                  <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    Pro
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleMenuItemClick(item.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </button>
            ))}
          </div>

          {/* 退出登录 */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t.userMenu.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
