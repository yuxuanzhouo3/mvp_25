"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookMarked, Trash2 } from "lucide-react"
import { QuestionCard } from "@/components/exam/QuestionCard"
import { AnswerFeedback } from "@/components/exam/AnswerFeedback"
import type { WrongQuestion } from "@/lib/types/assessment"

export default function AssessmentReviewPage() {
  const router = useRouter()
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<{
    userAnswer: number | number[] | string[]
    isCorrect: boolean
  } | null>(null)

  // 从 localStorage 加载错题
  useEffect(() => {
    const stored = localStorage.getItem('assessmentWrongQuestions')
    if (stored) {
      try {
        const questions = JSON.parse(stored)
        setWrongQuestions(questions)
      } catch (e) {
        console.error('Failed to parse wrong questions:', e)
      }
    }
  }, [])

  const handleAnswer = (answer: number | number[] | string[], timeSpent: number) => {
    const currentQuestion = wrongQuestions[currentIndex]
    let isCorrect = false

    // 判断正确性
    if (currentQuestion.type === 'single') {
      isCorrect = answer === currentQuestion.correctAnswer
    } else if (currentQuestion.type === 'multiple') {
      const userAns = (answer as number[]).sort()
      const correctAns = (currentQuestion.correctAnswer as number[]).sort()
      isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns)
    } else if (currentQuestion.type === 'fill') {
      const userAns = answer as string[]
      const correctAns = currentQuestion.correctAnswer as string[]
      isCorrect = userAns.every((ans, i) =>
        ans.trim().toLowerCase() === correctAns[i]?.trim().toLowerCase()
      )
    }

    setLastAnswer({ userAnswer: answer, isCorrect })
    setShowFeedback(true)

    // 如果答对了，从错题本移除
    if (isCorrect) {
      const newWrongQuestions = wrongQuestions.filter((_, i) => i !== currentIndex)
      setWrongQuestions(newWrongQuestions)
      localStorage.setItem('assessmentWrongQuestions', JSON.stringify(newWrongQuestions))
    }
  }

  const handleNext = () => {
    setShowFeedback(false)
    setLastAnswer(null)

    if (currentIndex < wrongQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // 所有题目都复习完了
      router.push('/dashboard')
    }
  }

  if (wrongQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <BookMarked className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">错题本为空</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">暂时没有错题需要复习</p>
          <Button onClick={() => router.push('/dashboard')}>返回首页</Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = wrongQuestions[currentIndex]

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <h1 className="text-lg font-semibold">
            错题复习 ({currentIndex + 1}/{wrongQuestions.length})
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {!showFeedback ? (
          <QuestionCard
            question={{
              id: currentQuestion.id,
              type: currentQuestion.type,
              content: currentQuestion.content,
              options: currentQuestion.options,
              correctAnswer: currentQuestion.correctAnswer,
              explanation: currentQuestion.explanation,
              difficulty: currentQuestion.difficulty as 1 | 2 | 3 | 4 | 5,
              knowledgePoint: currentQuestion.knowledgePoint,
              category: currentQuestion.category || ''
            }}
            questionNumber={currentIndex + 1}
            totalQuestions={wrongQuestions.length}
            onAnswer={handleAnswer}
          />
        ) : lastAnswer && (
          <AnswerFeedback
            isOpen={showFeedback}
            question={{
              id: currentQuestion.id,
              type: currentQuestion.type,
              content: currentQuestion.content,
              options: currentQuestion.options,
              correctAnswer: currentQuestion.correctAnswer,
              explanation: currentQuestion.explanation,
              difficulty: currentQuestion.difficulty as 1 | 2 | 3 | 4 | 5,
              knowledgePoint: currentQuestion.knowledgePoint,
              category: currentQuestion.category || ''
            }}
            userAnswer={lastAnswer.userAnswer}
            isCorrect={lastAnswer.isCorrect}
            pointsChange={0}
            currentPoints={0}
            comboCount={0}
            onNext={handleNext}
            onClose={() => setShowFeedback(false)}
          />
        )}
      </main>
    </div>
  )
}
