"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Brain,
  Zap,
  ChevronRight
} from "lucide-react"
import type { AssessmentResult, AssessmentDimension } from "@/lib/types/assessment"

interface AssessmentAnalysisProps {
  assessmentData: AssessmentResult
  onContinue: () => void
}

// 获取分数对应的颜色
function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-400"
  if (score >= 6) return "text-blue-400"
  if (score >= 4) return "text-yellow-400"
  return "text-orange-400"
}

// 获取分数对应的背景色
function getScoreBgColor(score: number): string {
  if (score >= 8) return "bg-green-500/20"
  if (score >= 6) return "bg-blue-500/20"
  if (score >= 4) return "bg-yellow-500/20"
  return "bg-orange-500/20"
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
          ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
          : 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isStrength ? 'bg-green-500/20' : 'bg-orange-500/20'}
        `}>
          {isStrength
            ? <Star className="w-5 h-5 text-green-400" />
            : <Target className="w-5 h-5 text-orange-400" />
          }
        </div>
        <div>
          <p className="font-medium text-white">{dimension.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{dimension.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`
          text-2xl font-bold tabular-nums
          ${isStrength ? 'text-green-400' : 'text-orange-400'}
        `}>
          {dimension.score}
        </span>
        <span className="text-slate-500 text-sm">/10</span>
      </div>
    </div>
  )
}

// 雷达图简化版 - 使用进度条展示
function DimensionRadar({ dimensions }: { dimensions: AssessmentDimension[] }) {
  return (
    <div className="space-y-3">
      {dimensions.map((dim) => (
        <div key={dim.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{dim.name}</span>
            <span className={`text-sm font-medium ${getScoreColor(dim.score)}`}>
              {dim.score}/10
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(dim.score).replace('/20', '')}`}
              style={{ width: `${dim.score * 10}%` }}
            />
          </div>
        </div>
      ))}
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

      {/* 能力雷达 */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">能力分布</h3>
        </div>
        <DimensionRadar dimensions={dimensions} />
      </Card>

      {/* 优势和劣势卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 优势区域 */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">你的优势</h3>
              <p className="text-xs text-slate-400">得分 ≥ 7 的技能</p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-300 border-green-500/30">
              {strengths.length} 项
            </Badge>
          </div>

          {strengths.length > 0 ? (
            <div className="space-y-3">
              {strengths.slice(0, 3).map((dim) => (
                <DimensionCard key={dim.id} dimension={dim} type="strength" />
              ))}
              {strengths.length > 3 && (
                <p className="text-center text-sm text-slate-500">
                  还有 {strengths.length - 3} 项优势技能
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-400">暂无明显优势，继续加油！</p>
            </div>
          )}
        </Card>

        {/* 劣势区域 */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">待提升领域</h3>
              <p className="text-xs text-slate-400">得分 ≤ 4 的技能</p>
            </div>
            <Badge className="ml-auto bg-orange-500/20 text-orange-300 border-orange-500/30">
              {weaknesses.length} 项
            </Badge>
          </div>

          {weaknesses.length > 0 ? (
            <div className="space-y-3">
              {weaknesses.slice(0, 3).map((dim) => (
                <DimensionCard key={dim.id} dimension={dim} type="weakness" />
              ))}
              {weaknesses.length > 3 && (
                <p className="text-center text-sm text-slate-500">
                  还有 {weaknesses.length - 3} 项待提升技能
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-400">太棒了！没有明显短板</p>
            </div>
          )}
        </Card>
      </div>

      {/* 总结与下一步 */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">针对性训练建议</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {weaknesses.length > 0 ? (
                <>
                  根据分析，你在
                  <span className="font-bold text-rose-600 mx-1">
                    {weaknesses.slice(0, 3).map(w => w.name).join('、')}
                  </span>
                  {weaknesses.length > 3 && `等 ${weaknesses.length} 个`}
                  方面需要重点加强。
                  AI 将为你生成针对这些薄弱环节的专项练习题，帮助你快速突破难点！
                </>
              ) : mediumDimensions.length > 0 ? (
                <>
                  你的基础不错！AI 将针对
                  <span className="font-bold text-indigo-600 mx-1">
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
                     bg-gradient-to-r from-indigo-600 to-purple-600
                     hover:from-indigo-700 hover:to-purple-700
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
