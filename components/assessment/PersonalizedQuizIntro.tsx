"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Bot,
  Target,
  Loader2,
  ArrowLeft,
  Lightbulb
} from "lucide-react"
import type { AssessmentDimension } from "@/lib/types/assessment"

interface PersonalizedQuizIntroProps {
  subjectName: string
  weaknesses: AssessmentDimension[]
  questionCount?: number
  isLoading?: boolean
  onStart: () => void
  onBack: () => void
}

export function PersonalizedQuizIntro({
  subjectName,
  weaknesses,
  questionCount = 10,
  isLoading = false,
  onStart,
  onBack
}: PersonalizedQuizIntroProps) {
  // 获取要展示的薄弱项（最多显示5个）
  const displayWeaknesses = weaknesses.slice(0, 5)
  const hasMoreWeaknesses = weaknesses.length > 5

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* AI 介绍卡片 */}
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 p-8 text-center">
        {/* AI 头像 */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Bot className="w-12 h-12 text-white" />
          </div>
          {/* 脉冲动画 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-ping opacity-20" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-slate-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-white mb-3">
          AI 智能出题助手
        </h2>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-6">
          {subjectName} · 针对性训练
        </Badge>

        {/* 话术 */}
        <div className="max-w-lg mx-auto">
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            根据您的能力评估，我发现以下薄弱环节需要加强：
          </p>
        </div>
      </Card>

      {/* 薄弱项标签展示 */}
      {weaknesses.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold text-white">待突破难点</h3>
            <Badge className="ml-auto bg-orange-500/20 text-orange-300 border-orange-500/30">
              {weaknesses.length} 项
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            {displayWeaknesses.map((weakness) => (
              <div
                key={weakness.id}
                className="px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30
                           flex items-center gap-2 transition-all hover:bg-orange-500/20 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-400">{weakness.score}</span>
                </div>
                <span className="text-orange-300 font-medium">{weakness.name}</span>
              </div>
            ))}
            {hasMoreWeaknesses && (
              <div className="px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600
                             text-slate-400 text-sm">
                +{weaknesses.length - 5} 更多
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI 计划说明 */}
      <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-2">我的训练计划</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              我将为您生成 <span className="text-blue-400 font-bold">{questionCount}</span> 道针对性练习题，
              题目将重点覆盖您的薄弱环节，帮助您快速突破难点。
              答题完成后，我会给出详细的分析报告，并预测您的考试通过概率。
            </p>
          </div>
        </div>

        {/* 题目分布预览 */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-2xl font-bold text-orange-400">60%</p>
              <p className="text-xs text-slate-400 mt-1">薄弱环节</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-2xl font-bold text-blue-400">30%</p>
              <p className="text-xs text-slate-400 mt-1">巩固提升</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-2xl font-bold text-green-400">10%</p>
              <p className="text-xs text-slate-400 mt-1">优势保持</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-4 rounded-xl bg-slate-700 hover:bg-slate-600
                     text-white font-medium transition-all duration-200
                     flex items-center justify-center gap-2 cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <button
          onClick={onStart}
          disabled={isLoading}
          className="flex-1 py-4 rounded-xl font-medium
                     bg-gradient-to-r from-blue-600 to-purple-600
                     hover:from-blue-700 hover:to-purple-700
                     text-white shadow-lg shadow-purple-600/20
                     transition-all duration-200 hover:shadow-purple-600/30
                     flex items-center justify-center gap-2 cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-lg">AI 正在生成题目...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span className="text-lg">开始针对练习</span>
            </>
          )}
        </button>
      </div>

      {/* 提示文字 */}
      <p className="text-center text-sm text-slate-500">
        预计用时 {Math.ceil(questionCount * 1.5)} - {questionCount * 2} 分钟 · 随时可暂停
      </p>
    </div>
  )
}
