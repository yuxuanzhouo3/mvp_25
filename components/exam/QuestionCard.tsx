"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Star, Tag, CheckCircle2 } from "lucide-react"
import type { Question } from "@/lib/exam-mock-data"

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: number | number[] | string[], timeSpent: number) => void
  disabled?: boolean
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  disabled = false
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | string[] | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime] = useState(Date.now())

  // 使用 useMemo 计算 questionType，避免在 question 为 undefined 时出错
  const questionType = useMemo(() => {
    return question?.type || 'single'
  }, [question?.type])

  const questionId = question?.id
  const blanksCount = question?.blanksCount

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  // 重置状态
  useEffect(() => {
    if (!questionId) return

    if (questionType === 'fill') {
      // 填空题：初始化为空字符串数组
      setSelectedAnswer(Array(blanksCount || 1).fill(''))
    } else if (questionType === 'multiple') {
      // 多选题：初始化为空数组
      setSelectedAnswer([])
    } else {
      // 单选题：初始化为 null
      setSelectedAnswer(null)
    }
    setTimeSpent(0)
  }, [questionId, questionType, blanksCount])

  // 选择答案（单选题和多选题）
  const handleSelectAnswer = (index: number) => {
    if (disabled || !question) return

    if (questionType === 'multiple') {
      // 多选题：切换选中状态
      setSelectedAnswer(prev => {
        const current = Array.isArray(prev) ? (prev as number[]) : []
        if (current.includes(index)) {
          return current.filter(i => i !== index)
        } else {
          return [...current, index]
        }
      })
    } else {
      // 单选题：直接设置并提交
      if (selectedAnswer !== null) return
      setSelectedAnswer(index)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      onAnswer(index, elapsed)
    }
  }

  // 填空题输入变化
  const handleFillBlankChange = (index: number, value: string) => {
    setSelectedAnswer(prev => {
      const current = Array.isArray(prev) ? (prev as string[]) : []
      const newAnswers = [...current]
      newAnswers[index] = value
      return newAnswers
    })
  }

  // 提交答案（多选题和填空题）
  const handleSubmit = () => {
    if (!canSubmit()) return
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    onAnswer(selectedAnswer!, elapsed)
  }

  // 检查是否可以提交
  const canSubmit = () => {
    if (questionType === 'multiple') {
      return Array.isArray(selectedAnswer) && selectedAnswer.length > 0
    } else if (questionType === 'fill') {
      return Array.isArray(selectedAnswer) && selectedAnswer.every(ans => typeof ans === 'string' && ans.trim().length > 0)
    }
    return false
  }

  // 难度星星
  const renderDifficulty = () => {
    const difficulty = question?.difficulty || 1
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(level => (
          <Star
            key={level}
            className={`w-4 h-4 ${
              level <= difficulty
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-slate-600'
            }`}
          />
        ))}
      </div>
    )
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 检查选项是否被选中
  const isOptionSelected = (index: number) => {
    if (questionType === 'multiple') {
      return Array.isArray(selectedAnswer) && (selectedAnswer as number[]).includes(index)
    } else {
      return selectedAnswer === index
    }
  }

  // 防止 question 为 undefined 的情况 - 放在所有 hooks 之后
  if (!question) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="text-center text-slate-400">
          加载题目中...
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      {/* 题目头部 */}
      <div className="bg-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 题号 */}
          <span className="text-slate-400">
            第 <span className="text-white font-bold">{questionNumber}</span> / {totalQuestions} 题
          </span>

          {/* 难度 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">难度:</span>
            {renderDifficulty()}
          </div>
        </div>

        {/* 计时器 */}
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(timeSpent)}</span>
        </div>
      </div>

      {/* 知识点标签 */}
      <div className="px-6 pt-4 flex items-center gap-2">
        <Tag className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
          {question.knowledgePoint}
        </span>
        {question.category && (
          <span className="text-sm text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
            {question.category}
          </span>
        )}
      </div>

      {/* 题目内容 */}
      <div className="px-6 py-6">
        <p className="text-lg text-white leading-relaxed whitespace-pre-wrap">
          {/* 多选题标记 */}
          {questionType === 'multiple' && (
            <span className="inline-block bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-sm font-medium mr-2">
              【多选题】
            </span>
          )}
          {question.content}
        </p>
      </div>

      {/* 选项列表（单选题和多选题） */}
      {(questionType === 'single' || questionType === 'multiple') && question.options && (
        <div className="px-6 pb-6 space-y-3">
          {question.options.map((option, index) => {
            const isSelected = isOptionSelected(index)
            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={disabled || (questionType === 'single' && selectedAnswer !== null)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : disabled
                    ? 'border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                      questionType === 'multiple'
                        ? 'rounded-md' // 多选题：方形
                        : 'rounded-full' // 单选题：圆形
                    } ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {questionType === 'multiple' ? (
                      isSelected ? <CheckCircle2 className="w-5 h-5" /> : ''
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span>{option.replace(/^[A-D]\.\s*/, '')}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 填空题输入框 */}
      {questionType === 'fill' && (
        <div className="px-6 pb-6 space-y-3">
          {Array.from({ length: question.blanksCount || 1 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm text-slate-400">填空 {index + 1}</label>
              <Input
                type="text"
                value={(selectedAnswer as string[])?.[index] || ''}
                onChange={(e) => handleFillBlankChange(index, e.target.value)}
                placeholder={`请输入填空 ${index + 1} 的答案`}
                disabled={disabled}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* 提交按钮（多选题和填空题） */}
      {(questionType === 'multiple' || questionType === 'fill') && (
        <div className="px-6 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={disabled || !canSubmit()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交答案
          </Button>
        </div>
      )}
    </Card>
  )
}
