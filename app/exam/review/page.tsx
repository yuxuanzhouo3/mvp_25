"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Play, BookOpen, Target, TrendingUp } from "lucide-react"
import { WrongBook } from "@/components/exam/WrongBook"
import type { WrongQuestion, Question } from "@/lib/exam-mock-data"
import { useT } from "@/lib/i18n"

export default function ReviewPage() {
  const router = useRouter()
  const t = useT()
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([])
  const [examName, setExamName] = useState(t.wrongBook.defaultExam)

  // 追踪是否已从 localStorage 加载完成，以及是否是用户操作触发的变化
  const isLoaded = useRef(false)
  const isUserAction = useRef(false)

  // 从 API 加载错题
  useEffect(() => {
    async function loadWrongQuestions() {
      try {
        const { fetchWrongQuestions } = await import('@/lib/services/wrong-questions')
        const data = await fetchWrongQuestions()

        console.log('Review page loaded wrongQuestions from API:', data.length, 'items')
        setWrongQuestions(data)

        // 同时更新 localStorage 作为缓存
        localStorage.setItem('examWrongQuestions', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to load wrong questions from API:', error)

        // 如果 API 失败，尝试从 localStorage 加载
        const savedWrongQuestions = localStorage.getItem('examWrongQuestions')
        if (savedWrongQuestions) {
          try {
            const parsed = JSON.parse(savedWrongQuestions)
            console.log('Fallback to localStorage:', parsed.length, 'items')
            setWrongQuestions(parsed)
          } catch (e) {
            console.error('Failed to parse wrong questions from localStorage')
          }
        }
      }
    }

    const savedExam = localStorage.getItem('currentExam')
    if (savedExam) {
      try {
        const exam = JSON.parse(savedExam)
        setExamName(exam.examName || t.wrongBook.defaultExam)
      } catch (e) {
        console.error('Failed to parse exam info')
      }
    }

    loadWrongQuestions()

    // 标记加载完成
    setTimeout(() => {
      isLoaded.current = true
    }, 100)
  }, [])

  // 保存到 localStorage - 仅在用户操作触发时保存
  useEffect(() => {
    // 只有在初始加载完成后且是用户操作触发时才保存
    if (isLoaded.current && isUserAction.current) {
      localStorage.setItem('examWrongQuestions', JSON.stringify(wrongQuestions))
      console.log('Review page saved wrongQuestions:', wrongQuestions.length, 'items')
      isUserAction.current = false
    }
  }, [wrongQuestions])

  // 重新练习
  const handlePractice = (question: Question) => {
    // 可以跳转到专门的复习练习模式
    router.push('/exam/practice')
  }

  // 标记已掌握
  const handleMarkMastered = (questionId: string) => {
    isUserAction.current = true
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
    isUserAction.current = true
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.common.back}
            </button>
            <h1 className="text-xl font-bold text-neutral-950 dark:text-white">{t.wrongBook.title}</h1>
            <Button
              onClick={() => router.push('/exam/practice')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {t.wrongBook.continuePractice}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* 考试信息 */}
        <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-950 dark:text-white">{examName} - {t.wrongBook.examWrongBook}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t.wrongBook.systematicReview}</p>
              </div>
            </div>

            {stats.highFrequency > 0 && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {stats.highFrequency} {t.wrongBook.highFrequencyWarning}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 学习建议 */}
        {stats.unmastered > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-600 dark:text-amber-400 font-medium">{t.wrongBook.studyAdvice}</p>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm mt-1">
                  {t.wrongBook.studyAdviceText.replace('{count}', String(stats.unmastered))}
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
