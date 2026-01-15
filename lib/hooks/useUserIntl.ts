/**
 * INTL 区域用户 Hook
 * 从 UserProviderIntl 获取用户状态和方法
 */

import { useContext } from 'react'
import { useUserIntl as useUserIntlContext } from '@/components/user-context-intl'

export function useUserIntl() {
  return useUserIntlContext()
}
