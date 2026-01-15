import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/auth/auth-provider'
import { UserProviderIntl } from '@/components/user-context-intl'
import { ThemeProvider } from '@/components/theme-provider'
import { isChinaRegion } from '@/lib/config/region'

export const metadata: Metadata = {
  title: 'AI 教师助手',
  description: '智能教学辅助平台',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isChina = isChinaRegion()

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {isChina ? (
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          ) : (
            <UserProviderIntl>
              {children}
              <Toaster />
            </UserProviderIntl>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
