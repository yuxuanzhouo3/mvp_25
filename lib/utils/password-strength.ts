/**
 * 密码强度计算工具
 */

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

export interface PasswordStrengthResult {
  strength: PasswordStrength
  label: string
  color: string
}

/**
 * 计算密码强度
 * @param password 密码
 * @returns 强度等级 0-4
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let strength: PasswordStrength = 0

  if (!password) {
    return { strength: 0, label: "请输入密码", color: "bg-gray-200" }
  }

  // 长度检查
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++

  // 包含小写字母
  if (/[a-z]/.test(password)) strength++

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++

  // 包含数字
  if (/[0-9]/.test(password)) strength++

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

  // 限制最大值为 4
  const normalizedStrength = Math.min(strength, 4) as PasswordStrength

  const strengthLabels: Record<PasswordStrength, string> = {
    0: "非常弱",
    1: "弱",
    2: "一般",
    3: "强",
    4: "非常强",
  }

  const strengthColors: Record<PasswordStrength, string> = {
    0: "bg-gray-200",
    1: "bg-red-500",
    2: "bg-yellow-500",
    3: "bg-blue-500",
    4: "bg-green-500",
  }

  return {
    strength: normalizedStrength,
    label: strengthLabels[normalizedStrength],
    color: strengthColors[normalizedStrength],
  }
}

/**
 * 验证密码是否符合要求
 * @param password 密码
 * @returns 是否符合最低要求
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 6) {
    return { isValid: false, message: "密码长度至少 6 个字符" }
  }

  if (password.length > 50) {
    return { isValid: false, message: "密码长度不能超过 50 个字符" }
  }

  return { isValid: true, message: "" }
}
