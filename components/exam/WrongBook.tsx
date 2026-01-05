"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  AlertTriangle
} from "lucide-react"
import type { WrongQuestion, Question } from "@/lib/exam-mock-data"

interface WrongBookProps {
  wrongQuestions: WrongQuestion[]
  onPractice: (question: Question) => void
  onMarkMastered: (questionId: string) => void
  onRemove: (questionId: string) => void
}

export function WrongBook({
  wrongQuestions,
  onPractice,
  onMarkMastered,
  onRemove
}: WrongBookProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('all')

  // 过滤错题
  const filteredQuestions = wrongQuestions.filter(wq => {
    if (filter === 'unmastered') return !wq.mastered
    if (filter === 'mastered') return wq.mastered
    return true
  })

  // 按知识点分组
  const groupedByKnowledge = filteredQuestions.reduce((acc, wq) => {
    const key = wq.question.knowledgePoint
    if (!acc[key]) acc[key] = []
    acc[key].push(wq)
    return acc
  }, {} as Record<string, WrongQuestion[]>)

  // 统计
  const stats = {
    total: wrongQuestions.length,
    unmastered: wrongQuestions.filter(w => !w.mastered).length,
    mastered: wrongQuestions.filter(w => w.mastered).length
  }

  if (wrongQuestions.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">太棒了！</h3>
        <p className="text-slate-400">你还没有错题，继续保持！</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-slate-400">总错题</div>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.unmastered}</div>
          <div className="text-sm text-slate-400">未掌握</div>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.mastered}</div>
          <div className="text-sm text-slate-400">已掌握</div>
        </Card>
      </div>

      {/* 过滤按钮 */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: '全部' },
          { value: 'unmastered', label: '未掌握' },
          { value: 'mastered', label: '已掌握' }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 按知识点分组显示 */}
      {Object.entries(groupedByKnowledge).map(([knowledge, questions]) => (
        <div key={knowledge} className="space-y-3">
          {/* 知识点标题 */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">{knowledge}</span>
            <Badge className="bg-slate-700 text-slate-300">
              {questions.length} 题
            </Badge>
          </div>

          {/* 错题列表 */}
          {questions.map(wq => (
            <Card
              key={wq.questionId}
              className={`border transition-all ${
                wq.mastered
                  ? 'bg-green-500/5 border-green-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              {/* 折叠头部 */}
              <button
                onClick={() => setExpandedId(expandedId === wq.questionId ? null : wq.questionId)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {wq.mastered ? (
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <span className="text-white truncate">
                    {wq.question.content.slice(0, 50)}...
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={`${
                      wq.wrongCount >= 3
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    错 {wq.wrongCount} 次
                  </Badge>
                  {expandedId === wq.questionId ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* 展开内容 */}
              {expandedId === wq.questionId && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* 题目内容 */}
                  <div>
                    <p className="text-slate-300 whitespace-pre-wrap">
                      {wq.question.content}
                    </p>
                  </div>

                  {/* 选项 */}
                  <div className="space-y-2">
                    {wq.question.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          i === wq.question.correctAnswer
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : wq.userAnswers.includes(i)
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {opt}
                        {i === wq.question.correctAnswer && (
                          <span className="ml-2">✓ 正确答案</span>
                        )}
                        {wq.userAnswers.includes(i) && i !== wq.question.correctAnswer && (
                          <span className="ml-2">✗ 你的选择</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 解析 */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-sm text-blue-400 mb-2">📖 解析</div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {wq.question.explanation}
                    </p>
                  </div>

                  {/* 错误历史 */}
                  {wq.wrongCount >= 2 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>这道题你已经错了 {wq.wrongCount} 次，建议重点复习！</span>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => onPractice(wq.question)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新练习
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkMastered(wq.questionId)}
                      className={
                        wq.mastered
                          ? 'border-slate-600 text-slate-400'
                          : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {wq.mastered ? '取消掌握' : '标记已掌握'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemove(wq.questionId)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
