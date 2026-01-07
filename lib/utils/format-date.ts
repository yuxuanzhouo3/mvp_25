/**
 * 日期格式化工具
 */

/**
 * 格式化日期为中文友好格式
 * @param dateInput 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "未知"

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) {
    return "无效日期"
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}年${month}月${day}日`
}

/**
 * 格式化日期为简短格式
 * @param dateInput 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDateShort(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "未知"

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) {
    return "无效日期"
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间
 * @param dateInput 日期字符串或 Date 对象
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "未知"

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) {
    return "无效日期"
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

/**
 * 获取相对时间描述
 * @param dateInput 日期字符串或 Date 对象
 * @returns 相对时间描述 (例如: "3天前", "1小时前")
 */
export function getRelativeTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "未知"

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) {
    return "无效日期"
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) return "刚刚"
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  if (diffWeeks < 4) return `${diffWeeks}周前`
  if (diffMonths < 12) return `${diffMonths}个月前`
  return `${diffYears}年前`
}
