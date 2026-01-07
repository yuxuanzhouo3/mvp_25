"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  User,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"

interface NavigationItem {
  title: string
  icon: React.ElementType
  href: string
}

const navigationItems: NavigationItem[] = [
  {
    title: "个人信息",
    icon: User,
    href: "/profile",
  },
  {
    title: "订阅管理",
    icon: CreditCard,
    href: "/profile/subscription",
  },
  {
    title: "支付记录",
    icon: Receipt,
    href: "/profile/payments",
  },
  {
    title: "账户设置",
    icon: Settings,
    href: "/profile/settings",
  },
]

interface SidebarNavigationProps {
  className?: string
}

export function SidebarNavigation({ className }: SidebarNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  const NavContent = () => (
    <>
      {/* 返回首页 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="h-4 w-4" />
          返回首页
        </Button>
      </div>

      {/* 导航项 */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 transition-colors",
                isActive && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Button>
          )
        })}
      </nav>

      {/* 退出登录 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:w-64 border-r border-gray-200 dark:border-gray-700 bg-card",
          className
        )}
      >
        <NavContent />
      </aside>

      {/* 移动端汉堡菜单 */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background">
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
