/**
 * 统一认证 Hook - 自动根据区域返回正确的认证上下文
 * CN 区域: 返回 CloudBase AuthProvider
 * INTL 区域: 返回 Supabase UserProviderIntl
 */

import { isChinaRegion } from '@/lib/config/region'
import { useAuth as useAuthCN } from '@/components/auth/auth-provider'
import { useUserIntl } from '@/components/user-context-intl'

/**
 * 根据部署区域自动选择正确的认证 hook
 *
 * @returns CN 区域返回 CloudBase auth context, INTL 区域返回 Supabase user context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signOut } = useAuth()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!user) return <div>Not logged in</div>
 *
 *   return <div>Welcome, {user.email}</div>
 * }
 * ```
 */
export function useAuth() {
  const isCN = isChinaRegion()

  if (isCN) {
    // CN 区域: 使用 CloudBase AuthProvider
    return useAuthCN()
  } else {
    // INTL 区域: 使用 Supabase UserProviderIntl
    return useUserIntl()
  }
}
