"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Brain, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { isChinaRegion } from "@/lib/config/region"

export default function LandingPage() {
  const router = useRouter()
  const isChina = isChinaRegion()

  // Use the appropriate auth hook based on region
  const authChina = isChina ? useAuth() : { isAuthenticated: false, isLoading: false }
  const authIntl = !isChina ? useUserIntl() : { isAuthenticated: false, isLoading: false }

  const isAuthenticated = isChina ? authChina.isAuthenticated : authIntl.isAuthenticated
  const isLoading = isChina ? authChina.isLoading : authIntl.isLoading

  const isIntl = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION === 'INTL'

  // Handle login button click
  const handleLogin = () => {
    // Always navigate to web login page, regardless of environment
    router.push("/login")
  }

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state while checking auth
  if (isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-black dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-neutral-950 dark:text-white">
            {isIntl ? 'AI Teaching Assistant' : '晨佑AI教学'}
          </div>
          <Button
            onClick={handleLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-3 min-h-[44px]"
          >
            {isIntl ? 'Login/Register' : '登录/注册'}
          </Button>
        </div>
      </header>

      {/* Banner */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-neutral-950 dark:text-white mb-4 md:mb-6">
          {isIntl ? 'AI Teaching Assistant' : '晨佑AI教学'}
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-4 md:mb-8">
          {isIntl ? 'Your Intelligent AI Tutor' : '您的智能AI助教'}
        </p>
        <p className="text-base md:text-lg text-neutral-500 dark:text-neutral-500 mb-8 md:mb-12">
          {isIntl
            ? 'AI-powered document analysis, intelligent question generation, and personalized learning paths'
            : 'AI驱动的文档解析、智能出题与个性化学习路径'
          }
        </p>
        <Button
          onClick={handleLogin}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-base md:text-lg px-6 py-5 md:px-8 md:py-6 min-h-[48px]"
        >
          {isIntl ? 'Get Started' : '立即开始'}
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <FileText className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              {isIntl ? 'Smart Document Analysis' : '智能文档解析'}
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
              {isIntl
                ? 'Support multiple formats, accurately extract knowledge points'
                : '支持多格式上传，精准提取知识点'
              }
            </p>
          </Card>

          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <Brain className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              {isIntl ? 'AI Auto Question Generation' : 'AI 自动出题'}
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
              {isIntl
                ? 'Generate quiz papers based on document content with one click'
                : '基于文档内容，一键生成测验试卷'
              }
            </p>
          </Card>

          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <TrendingUp className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              {isIntl ? 'Personalized Learning' : '个性化学习'}
            </h3>
            <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
              {isIntl
                ? 'Generate personalized learning recommendations based on quiz performance'
                : '根据答题情况生成专属学习建议'
              }
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-neutral-500 dark:text-neutral-500">
          <p>{isIntl ? '© 2026 AI Teaching Assistant' : <>© 2026 晨佑AI教学 | <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:underline">粤ICP备2024281756号-3</a></>}</p>
        </div>
      </footer>
    </div>
  )
}
