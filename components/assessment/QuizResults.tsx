"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Target,
  Flame,
  BookMarked,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Sparkles,
  Star,
  TrendingUp,
  BarChart3,
  Clock,
  Award
} from "lucide-react"
import { PassProbabilityCard } from "./PassProbabilityCard"
import type { PerformanceAnalysis, DimensionBreakdown } from "@/lib/types/assessment"
import { getGradeColor } from "@/lib/types/assessment"
import confetti from 'canvas-confetti'

interface QuizResultsProps {
  subjectName: string
  analysis: PerformanceAnalysis
  maxCombo?: number
  onRestart: () => void
  onGoHome: () => void
  onGoReview?: () => void
}

// 维度表现卡片
function DimensionPerformanceCard({ breakdown }: { breakdown: DimensionBreakdown }) {
  const accuracyPercent = breakdown.questionsCount > 0
    ? Math.round((breakdown.correctCount / breakdown.questionsCount) * 100)
    : 0

  const getPerformanceColor = () => {
    if (accuracyPercent >= 80) return 'text-green-400'
    if (accuracyPercent >= 60) return 'text-blue-400'
    if (accuracyPercent >= 40) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getBarColor = () => {
    if (accuracyPercent >= 80) return 'bg-green-500'
    if (accuracyPercent >= 60) return 'bg-blue-500'
    if (accuracyPercent >= 40) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white text-sm">{breakdown.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getPerformanceColor()}`}>
            {accuracyPercent}%
          </span>
          <span className="text-xs text-slate-500">
            ({breakdown.correctCount}/{breakdown.questionsCount})
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${accuracyPercent}%` }}
        />
      </div>

      {/* 对比信息 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          原始评分: <span className="text-slate-400">{breakdown.originalScore}/10</span>
        </span>
        {breakdown.improvement && (
          <span className={`
            ${breakdown.improvement.startsWith('+') ? 'text-green-400' : 'text-orange-400'}
          `}>
            {breakdown.improvement}
          </span>
        )}
      </div>
    </div>
  )
}

export function QuizResults({
  subjectName,
  analysis,
  maxCombo = 0,
  onRestart,
  onGoHome,
  onGoReview
}: QuizResultsProps) {
  const [showContent, setShowContent] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  const {
    overallAccuracy,
    totalQuestions,
    correctCount,
    wrongCount,
    avgTimePerQuestion,
    dimensionBreakdown,
    passProbability,
    recommendations,
    grade
  } = analysis

  const gradeColor = getGradeColor(grade)

  // 入场动画和撒花效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
      if (overallAccuracy >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [overallAccuracy])

  // 分数动画
  useEffect(() => {
    if (!showContent) return

    const duration = 1500
    const steps = 60
    const increment = overallAccuracy / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= overallAccuracy) {
        setAnimatedScore(overallAccuracy)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [showContent, overallAccuracy])

  // 获取评级文字
  const getGradeText = () => {
    switch (grade) {
      case 'S': return '完美发挥！'
      case 'A': return '表现优秀！'
      case 'B': return '良好水平！'
      case 'C': return '继续努力！'
      default: return '需要加油！'
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className={`w-full max-w-3xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* 头部 - 评级展示 */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${gradeColor} shadow-2xl mb-4 animate-pulse`}>
              <span className="text-6xl font-black text-white drop-shadow-lg">{grade}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{getGradeText()}</h1>
            <p className="text-slate-400">《{subjectName}》针对性练习完成</p>
          </div>

          {/* 主卡片 */}
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 p-6 mb-6">
            {/* 正确率环形图 */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#resultGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${animatedScore * 4.4} 440`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="resultGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{animatedScore}%</span>
                  <span className="text-sm text-slate-400">正确率</span>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                <div className="text-xs text-slate-400">总题数</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                <div className="text-xs text-slate-400">答对</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
                <div className="text-xs text-slate-400">答错</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-orange-400">{avgTimePerQuestion}s</div>
                <div className="text-xs text-slate-400">平均用时</div>
              </div>
            </div>

            {/* 维度表现 */}
            {dimensionBreakdown.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  各维度表现
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dimensionBreakdown.map((breakdown) => (
                    <DimensionPerformanceCard key={breakdown.dimensionId} breakdown={breakdown} />
                  ))}
                </div>
              </div>
            )}

            {/* 成就徽章 */}
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                本次练习成就
              </h3>
              <div className="flex flex-wrap gap-2">
                {correctCount >= 5 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm">
                    <Star className="w-3 h-3" />
                    答对5题+
                  </div>
                )}
                {maxCombo >= 3 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm">
                    <Flame className="w-3 h-3" />
                    连击达人
                  </div>
                )}
                {overallAccuracy >= 80 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                    <TrendingUp className="w-3 h-3" />
                    高正确率
                  </div>
                )}
                {totalQuestions >= 10 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                    <Sparkles className="w-3 h-3" />
                    全部完成
                  </div>
                )}
                {avgTimePerQuestion <= 30 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm">
                    <Clock className="w-3 h-3" />
                    快速答题
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 通过率预测卡片 */}
          <div className="mb-6">
            <PassProbabilityCard
              passProbability={passProbability}
              subjectName={subjectName}
            />
          </div>

          {/* 学习建议 */}
          {recommendations.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                学习建议
              </h3>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-slate-700/30"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-300">{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={onRestart}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              再来一轮
            </Button>
            {onGoReview && wrongCount > 0 ? (
              <Button
                onClick={onGoReview}
                variant="outline"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 py-6 cursor-pointer"
              >
                <BookMarked className="w-5 h-5 mr-2" />
                复习错题 ({wrongCount})
              </Button>
            ) : (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 py-6 cursor-pointer"
              >
                <Home className="w-5 h-5 mr-2" />
                返回首页
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
