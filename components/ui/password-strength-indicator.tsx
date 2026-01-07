"use client"

import { cn } from "@/lib/utils"
import { calculatePasswordStrength, type PasswordStrength } from "@/lib/utils/password-strength"

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { strength, label, color } = calculatePasswordStrength(password)

  if (!password) return null

  return (
    <div className={cn("space-y-1", className)}>
      {/* 强度条 */}
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "flex-1 rounded-full transition-colors duration-200",
              strength >= level ? color : "bg-gray-200 dark:bg-gray-700"
            )}
          />
        ))}
      </div>

      {/* 强度文字 */}
      <p className="text-xs text-muted-foreground">
        密码强度: <span className={cn(
          strength === 1 && "text-red-500",
          strength === 2 && "text-yellow-500",
          strength === 3 && "text-blue-500",
          strength === 4 && "text-green-500"
        )}>{label}</span>
      </p>
    </div>
  )
}
