"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, BookOpen, Target, TrendingUp } from "lucide-react"
import { WrongBook } from "@/components/exam/WrongBook"
import type { WrongQuestion, Question } from "@/lib/exam-mock-data"

export default function ReviewPage() {
  const router = useRouter()
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([])
  const [examName, setExamName] = useState("考研数学")

  // 追踪是否已从 localStorage 加载完成
  const isLoaded = useRef(false)

  // 从 localStorage 加载
  useEffect(() => {
    const savedWrongQuestions = localStorage.getItem('examWrongQuestions')
    const savedExam = localStorage.getItem('currentExam')

    if (savedWrongQuestions) {
      try {
        const parsed = JSON.parse(savedWrongQuestions)
        console.log('Review page loaded wrongQuestions:', parsed.length, 'items')
        setWrongQuestions(parsed)
      } catch (e) {
        console.error('Failed to parse wrong questions')
      }
    }

    if (savedExam) {
      try {
        const exam = JSON.parse(savedExam)
        setExamName(exam.examName || "考研数学")
      } catch (e) {
        console.error('Failed to parse exam info')
      }
    }

    // 标记加载完成
    isLoaded.current = true
  }, [])

  // 保存到 localStorage - 仅在加载完成后且由用户操作触发时保存
  useEffect(() => {
    // 只有在初始加载完成后才保存，避免空数组覆盖已有数据
    if (isLoaded.current) {
      localStorage.setItem('examWrongQuestions', JSON.stringify(wrongQuestions))
      console.log('Review page saved wrongQuestions:', wrongQuestions.length, 'items')
    }
  }, [wrongQuestions])

  // 重新练习
  const handlePractice = (question: Question) => {
    // 可以跳转到专门的复习练习模式
    router.push('/exam/practice')
  }

  // 标记已掌握
  const handleMarkMastered = (questionId: string) => {
    setWrongQuestions(prev =>
      prev.map(wq =>
        wq.questionId === questionId
          ? { ...wq, mastered: !wq.mastered }
          : wq
      )
    )
  }

  // 移除错题
  const handleRemove = (questionId: string) => {
    setWrongQuestions(prev =>
      prev.filter(wq => wq.questionId !== questionId)
    )
  }

  // 统计
  const stats = {
    total: wrongQuestions.length,
    unmastered: wrongQuestions.filter(w => !w.mastered).length,
    mastered: wrongQuestions.filter(w => w.mastered).length,
    highFrequency: wrongQuestions.filter(w => w.wrongCount >= 3).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </button>
            <h1 className="text-xl font-bold text-white">错题本</h1>
            <Button
              onClick={() => router.push('/exam/practice')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Play className="w-4 h-4 mr-2" />
              继续刷题
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* 考试信息 */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{examName} - 错题本</h2>
                <p className="text-slate-400 text-sm">系统化复习，攻克薄弱知识点</p>
              </div>
            </div>

            {stats.highFrequency > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">
                    {stats.highFrequency} 道高频错题需重点关注
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 学习建议 */}
        {stats.unmastered > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">学习建议</p>
                <p className="text-slate-300 text-sm mt-1">
                  你还有 {stats.unmastered} 道错题未掌握。建议每天复习 3-5 道错题，
                  重点关注错 3 次以上的题目。坚持复习，错题本会越来越薄！
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 错题列表 */}
        <WrongBook
          wrongQuestions={wrongQuestions}
          onPractice={handlePractice}
          onMarkMastered={handleMarkMastered}
          onRemove={handleRemove}
        />
      </main>
    </div>
  )
}
