"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Brain, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-black dark:to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-neutral-950 dark:text-white">
            晨佑AI教学
          </div>
          <Button
            onClick={() => router.push("/auth/login")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            登录/注册
          </Button>
        </div>
      </header>

      {/* Banner */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-neutral-950 dark:text-white mb-6">
          晨佑AI教学
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
          您的智能AI助教
        </p>
        <p className="text-lg text-neutral-500 dark:text-neutral-500 mb-12">
          AI驱动的文档解析、智能出题与个性化学习路径
        </p>
        <Button
          onClick={() => router.push("/auth/login")}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6"
        >
          立即开始
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <FileText className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              智能文档解析
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              支持多格式上传，精准提取知识点
            </p>
          </Card>

          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <Brain className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              AI 自动出题
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              基于文档内容，一键生成测验试卷
            </p>
          </Card>

          <Card className="p-6 border-neutral-200 dark:border-neutral-800">
            <TrendingUp className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-2">
              个性化学习
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              根据答题情况生成专属学习建议
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-neutral-500 dark:text-neutral-500">
          <p>© 2026 晨佑AI教学 | <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:underline">粤ICP备2024281756号-3</a></p>
        </div>
      </footer>
    </div>
  )
}
