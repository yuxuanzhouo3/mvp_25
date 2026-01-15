import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/auth/auth-provider'
import { UserProviderIntl } from '@/components/user-context-intl'
import { ThemeProvider } from '@/components/theme-provider'
import { isChinaRegion } from '@/lib/config/region'

const isChina = isChinaRegion()

export const metadata: Metadata = {
  title: isChina ? 'AI 教师助手' : 'AI Teacher Assistant',
  description: isChina ? '智能教学辅助平台' : 'Smart Teaching Platform',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={isChina ? "zh-CN" : "en"} suppressHydrationWarning>
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
