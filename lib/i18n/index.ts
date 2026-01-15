/**
 * 国际化系统入口
 * - 国内版(CN): 默认中文，支持切换到英文
 * - 国际版(INTL): 默认英文，支持切换到中文
 */

import { useState, useEffect } from "react"
import { isChinaRegion } from "@/lib/config/region"
import { zhCN, type Translations } from "./translations/zh-CN"
import { enUS } from "./translations/en-US"

const LANGUAGE_KEY = "app_language"

/**
 * 获取默认语言（用于 SSR）
 */
function getDefaultLanguage(): "zh-CN" | "en-US" {
  return isChinaRegion() ? "zh-CN" : "en-US"
}

/**
 * 获取当前语言
 * 优先读取用户设置，否则根据区域返回默认语言
 */
export function getCurrentLanguage(): "zh-CN" | "en-US" {
  // 优先读取用户设置
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    if (saved === "zh-CN" || saved === "en-US") return saved
  }
  // 默认：国内版中文，国际版英文
  return getDefaultLanguage()
}

/**
 * 获取翻译对象
 */
export function getTranslations(lang?: "zh-CN" | "en-US"): Translations {
  const language = lang ?? getDefaultLanguage()
  return language === "zh-CN" ? zhCN : enUS
}

/**
 * Hook: 获取翻译对象
 * 使用 useState + useEffect 避免水合错误
 */
export function useT(): Translations {
  const defaultLang = getDefaultLanguage()
  const [lang, setLang] = useState<"zh-CN" | "en-US">(defaultLang)

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    if (saved === "zh-CN" || saved === "en-US") {
      setLang(saved)
    }
  }, [])

  return lang === "zh-CN" ? zhCN : enUS
}

/**
 * 设置语言（国内版和国际版都可用）
 */
export function setLanguage(lang: "en-US" | "zh-CN") {
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_KEY, lang)
    window.location.reload()
  }
}

/**
 * 获取 HTML lang 属性值
 */
export function getHtmlLang(): string {
  return getCurrentLanguage() === "zh-CN" ? "zh-CN" : "en"
}

export { zhCN, enUS }
export type { Translations }
