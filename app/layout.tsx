import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/lib/i18n'
import { Providers } from '@/components/providers'

const isChina = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION !== 'INTL'

export const metadata: Metadata = {
  title: isChina ? 'AI 教师助手' : 'AI Teacher Assistant',
  description: isChina ? '智能教学辅助平台' : 'Smart Teaching Platform',
  generator: 'v0.dev',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <I18nProvider>
            <Providers>
              {children}
            </Providers>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
