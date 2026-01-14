"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Brain,
  ChevronRight
} from "lucide-react"
import type { AssessmentResult, AssessmentDimension } from "@/lib/types/assessment"

interface AssessmentAnalysisProps {
  assessmentData: AssessmentResult
  onContinue: () => void
}

// 维度卡片组件
function DimensionCard({
  dimension,
  type
}: {
  dimension: AssessmentDimension
  type: 'strength' | 'weakness'
}) {
  const isStrength = type === 'strength'

  return (
    <div
      className={`
        flex items-center justify-between p-4 rounded-xl border
        transition-all duration-200 hover:scale-[1.02] cursor-pointer
        ${isStrength
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
          : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isStrength ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-orange-100 dark:bg-orange-900/50'}
        `}>
          {isStrength
            ? <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            : <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          }
        </div>
        <div>
          <p className="font-medium text-neutral-950 dark:text-white">{dimension.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{dimension.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`
          text-2xl font-bold tabular-nums
          ${isStrength ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}
        `}>
          {dimension.score}
        </span>
        <span className="text-neutral-500 dark:text-neutral-500 text-sm">/10</span>
      </div>
    </div>
  )
}

export function AssessmentAnalysis({ assessmentData, onContinue }: AssessmentAnalysisProps) {
  const { subjectName, dimensions, strengths, weaknesses } = assessmentData

  // 计算平均分
  const avgScore = dimensions.reduce((acc, d) => acc + d.score, 0) / dimensions.length

  // 获取中等水平的维度 (5-6分)
  const mediumDimensions = dimensions.filter(d => d.score >= 5 && d.score <= 6)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 标题卡片 */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">你的能力分析报告</h2>
              <Badge className="bg-white/20 text-white border-0">
                {subjectName}
              </Badge>
            </div>
            <p className="text-indigo-100">
              AI 已完成对你 <span className="font-bold text-white">{dimensions.length}</span> 项技能的深度分析
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-100">综合评分</p>
            <p className="text-4xl font-bold text-white">{avgScore.toFixed(1)}</p>
          </div>
        </div>
      </Card>

      {/* 优势和劣势卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 优势区域 */}
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-950 dark:text-white">你的优势</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">得分 ≥ 7 的技能</p>
            </div>
            <Badge className="ml-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              {strengths.length} 项
            </Badge>
          </div>

          {strengths.length > 0 ? (
            <div className="space-y-3">
              {strengths.slice(0, 3).map((dim) => (
                <DimensionCard key={dim.id} dimension={dim} type="strength" />
              ))}
              {strengths.length > 3 && (
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-500">
                  还有 {strengths.length - 3} 项优势技能
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">暂无明显优势，继续加油！</p>
            </div>
          )}
        </Card>

        {/* 劣势区域 */}
        <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-950 dark:text-white">待提升领域</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">得分 ≤ 4 的技能</p>
            </div>
            <Badge className="ml-auto bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              {weaknesses.length} 项
            </Badge>
          </div>

          {weaknesses.length > 0 ? (
            <div className="space-y-3">
              {weaknesses.slice(0, 3).map((dim) => (
                <DimensionCard key={dim.id} dimension={dim} type="weakness" />
              ))}
              {weaknesses.length > 3 && (
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-500">
                  还有 {weaknesses.length - 3} 项待提升技能
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">太棒了！没有明显短板</p>
            </div>
          )}
        </Card>
      </div>

      {/* 总结与下一步 */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">针对性训练建议</h3>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
              {weaknesses.length > 0 ? (
                <>
                  根据分析，你在
                  <span className="font-bold text-rose-600 dark:text-rose-400 mx-1">
                    {weaknesses.slice(0, 3).map(w => w.name).join('、')}
                  </span>
                  {weaknesses.length > 3 && `等 ${weaknesses.length} 个`}
                  方面需要重点加强。
                  AI 将为你生成针对这些薄弱环节的专项练习题，帮助你快速突破难点！
                </>
              ) : mediumDimensions.length > 0 ? (
                <>
                  你的基础不错！AI 将针对
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 mx-1">
                    {mediumDimensions.slice(0, 3).map(m => m.name).join('、')}
                  </span>
                  等中等水平的技能进行巩固训练。
                </>
              ) : (
                <>
                  你的整体水平很高！AI 将为你生成综合性的进阶题目，帮助你更上一层楼。
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full mt-6 py-4 rounded-xl font-bold text-lg
                     bg-indigo-600 hover:bg-indigo-700
                     text-white shadow-lg
                     transition-all duration-200 hover:shadow-xl
                     flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>继续，开始针对性练习</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </Card>
    </div>
  )
}
