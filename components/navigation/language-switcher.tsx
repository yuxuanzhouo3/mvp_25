"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { getCurrentLanguage, setLanguage } from "@/lib/i18n"

export function LanguageSwitcher() {
  const currentLang = getCurrentLanguage()

  const toggleLanguage = () => {
    setLanguage(currentLang === "zh-CN" ? "en-US" : "zh-CN")
  }

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      title={currentLang === "zh-CN" ? "Switch to English" : "切换到中文"}
      className="cursor-pointer h-10 px-4 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <Globe className="h-5 w-5 mr-2" />
      <span className="text-sm font-medium">
        {currentLang === "zh-CN" ? "English" : "中文"}
      </span>
    </Button>
  )
}
