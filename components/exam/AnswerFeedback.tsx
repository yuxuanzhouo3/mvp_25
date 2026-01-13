"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  BookMarked,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  X,
  Check,
  Trophy
} from "lucide-react"
import type { Question } from "@/lib/exam-mock-data"

interface AnswerFeedbackProps {
  isOpen: boolean
  isCorrect: boolean
  question: Question
  userAnswer: number | number[] | string[]
  pointsChange: number
  currentPoints: number
  comboCount: number
  isLastQuestion?: boolean // 是否是最后一题
  partialScore?: number // 填空题部分得分
  onFollowUp: () => void
  onAddToWrongBook: () => void
  onNext: () => void
  onClose: () => void
}

export function AnswerFeedback({
  isOpen,
  isCorrect,
  question,
  userAnswer,
  pointsChange,
  currentPoints,
  comboCount,
  isLastQuestion = false,
  partialScore,
  onFollowUp,
  onAddToWrongBook,
  onNext,
  onClose
}: AnswerFeedbackProps) {
  // 记录是否已添加到错题本
  const [isAddedToWrongBook, setIsAddedToWrongBook] = useState(false)

  const questionType = question.type || 'single'

  // 当弹窗关闭或切换题目时重置状态
  useEffect(() => {
    if (!isOpen) {
      setIsAddedToWrongBook(false)
    }
  }, [isOpen, question.id])

  // 处理添加到错题本
  const handleAddToWrongBook = () => {
    onAddToWrongBook()
    setIsAddedToWrongBook(true)
  }

  // 渲染用户答案
  const renderUserAnswer = () => {
    if (questionType === 'fill') {
      const answers = userAnswer as string[]
      return (
        <div className="space-y-1">
          {answers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-neutral-500">填空{i + 1}:</span>
              <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {ans || '(未填写)'}
              </span>
            </div>
          ))}
        </div>
      )
    } else if (questionType === 'multiple') {
      const indices = userAnswer as number[]
      if (!question.options) return null
      return (
        <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
          {indices.map(idx => question.options![idx]).join(', ')}
        </span>
      )
    } else {
      if (!question.options) return null
      return (
        <span className={isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
          {question.options[userAnswer as number]}
        </span>
      )
    }
  }

  // 渲染正确答案
  const renderCorrectAnswer = () => {
    if (questionType === 'fill') {
      const answers = question.correctAnswer as string[]
      return (
        <div className="space-y-1">
          {answers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-neutral-500">填空{i + 1}:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{ans}</span>
            </div>
          ))}
        </div>
      )
    } else if (questionType === 'multiple') {
      const indices = question.correctAnswer as number[]
      if (!question.options) return null
      return (
        <span className="text-emerald-600 dark:text-emerald-400">
          {indices.map(idx => question.options![idx]).join(', ')}
        </span>
      )
    } else {
      if (!question.options) return null
      return (
        <span className="text-emerald-600 dark:text-emerald-400">
          {question.options[question.correctAnswer as number]}
        </span>
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className={`w-full max-w-lg border-2 ${
        isCorrect
          ? 'bg-white dark:bg-neutral-950 border-emerald-500/50'
          : 'bg-white dark:bg-neutral-950 border-red-500/50'
      } animate-in zoom-in-95 slide-in-from-bottom-4 duration-300`}>
        {/* 头部 */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'
        }`}>
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <>
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">回答正确！</span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <span className="text-lg font-bold text-red-600 dark:text-red-400">回答错误</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 答案对比 */}
          <div className="space-y-2">
            <div className={questionType === 'fill' ? 'space-y-2' : 'flex items-center gap-2'}>
              <span className="text-neutral-500 dark:text-neutral-400">你的{questionType === 'fill' ? '答案' : '选择'}:</span>
              {renderUserAnswer()}
            </div>
            {!isCorrect && (
              <div className={questionType === 'fill' ? 'space-y-2' : 'flex items-center gap-2'}>
                <span className="text-neutral-500 dark:text-neutral-400">正确答案:</span>
                {renderCorrectAnswer()}
              </div>
            )}
          </div>

          {/* 部分得分提示（填空题） */}
          {questionType === 'fill' && !isCorrect && partialScore !== undefined && partialScore > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">
                  部分正确：{Math.round(partialScore * 100)}% 得分
                </span>
              </div>
            </div>
          )}

          {/* 分隔线 */}
          <div className="border-t border-neutral-200 dark:border-neutral-800" />

          {/* 解析 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">解析</span>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          </div>

          {/* 知识点提示 */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">💡</span>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              知识点: <span className="text-indigo-600 dark:text-indigo-400">{question.knowledgePoint}</span>
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onFollowUp}
              className="flex-1 border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              追问模式
            </Button>
            {!isCorrect && (
              <Button
                variant="outline"
                onClick={handleAddToWrongBook}
                disabled={isAddedToWrongBook}
                className={`flex-1 ${
                  isAddedToWrongBook
                    ? 'border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                }`}
              >
                {isAddedToWrongBook ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    已加入错题本
                  </>
                ) : (
                  <>
                    <BookMarked className="w-4 h-4 mr-2" />
                    加入错题本
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 下一题按钮 */}
          <Button
            onClick={onNext}
            className={`w-full ${
              isLastQuestion
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : isCorrect
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isLastQuestion ? (
              <>
                完成答题
                <Trophy className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                继续下一题
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* 底部积分变化 */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${
          isCorrect ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
        }`}>
          <div className="flex items-center gap-4">
            {/* 积分变化 */}
            <div className="flex items-center gap-1">
              {pointsChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className={pointsChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {pointsChange > 0 ? '+' : ''}{pointsChange} 积分
              </span>
            </div>

            {/* 当前积分 */}
            <div className="text-neutral-500 dark:text-neutral-400">
              当前: <span className="text-neutral-950 dark:text-white font-bold">{currentPoints}</span>
            </div>
          </div>

          {/* 连击状态 */}
          {isCorrect && comboCount > 0 ? (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4 animate-pulse" />
              <span className="font-bold">连击 x{comboCount}</span>
              {comboCount >= 3 && comboCount < 5 && <span className="text-xs">+5</span>}
              {comboCount >= 5 && comboCount < 10 && <span className="text-xs">+10</span>}
              {comboCount >= 10 && <span className="text-xs">+20</span>}
            </div>
          ) : !isCorrect ? (
            <div className="flex items-center gap-1 text-neutral-500">
              <span>💔</span>
              <span>连击中断</span>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
