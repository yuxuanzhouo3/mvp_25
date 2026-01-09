"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import {
  User,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react"

const menuItems = [
  { title: "个人信息", icon: User, href: "/profile" },
  { title: "订阅管理", icon: CreditCard, href: "/profile/subscription" },
  { title: "支付记录", icon: Receipt, href: "/profile/payments" },
  { title: "账户设置", icon: Settings, href: "/profile/settings" },
]

export function UserAvatarMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-slate-500 transition-all duration-200 focus:outline-none focus:ring-slate-500"
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
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 用户信息头部 */}
          <div className="px-4 py-3 border-b border-slate-700">
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
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "用户"}
                </p>
                <p className="text-xs text-slate-400 truncate">
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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </button>
            ))}
          </div>

          {/* 退出登录 */}
          <div className="border-t border-slate-700 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
