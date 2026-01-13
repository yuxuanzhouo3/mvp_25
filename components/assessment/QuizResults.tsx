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
  wrongCount?: number
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
    if (accuracyPercent >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (accuracyPercent >= 60) return 'text-indigo-600 dark:text-indigo-400'
    if (accuracyPercent >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const getBarColor = () => {
    if (accuracyPercent >= 80) return 'bg-emerald-500'
    if (accuracyPercent >= 60) return 'bg-indigo-500'
    if (accuracyPercent >= 40) return 'bg-amber-500'
    return 'bg-orange-500'
  }

  return (
    <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-neutral-950 dark:text-white text-sm">{breakdown.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getPerformanceColor()}`}>
            {accuracyPercent}%
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-500">
            ({breakdown.correctCount}/{breakdown.questionsCount})
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${accuracyPercent}%` }}
        />
      </div>

      {/* 对比信息 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500 dark:text-neutral-500">
          原始评分: <span className="text-neutral-600 dark:text-neutral-400">{breakdown.originalScore}/10</span>
        </span>
        {breakdown.improvement && (
          <span className={`
            ${breakdown.improvement.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}
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
  wrongCount: wrongCountProp,
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className={`w-full max-w-3xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* 头部 - 评级展示 */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${gradeColor} shadow-2xl mb-4 animate-pulse`}>
              <span className="text-6xl font-black text-white drop-shadow-lg">{grade}</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-950 dark:text-white mb-2">{getGradeText()}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">《{subjectName}》针对性练习完成</p>
          </div>

          {/* 主卡片 */}
          <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
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
                    className="text-neutral-200 dark:text-neutral-700"
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
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-neutral-950 dark:text-white">{animatedScore}%</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">正确率</span>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-neutral-950 dark:text-white">{totalQuestions}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">总题数</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">答对</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{wrongCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">答错</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{avgTimePerQuestion}s</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">平均用时</div>
              </div>
            </div>

            {/* 维度表现 */}
            {dimensionBreakdown.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                本次练习成就
              </h3>
              <div className="flex flex-wrap gap-2">
                {correctCount >= 5 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400 text-sm">
                    <Star className="w-3 h-3" />
                    答对5题+
                  </div>
                )}
                {maxCombo >= 3 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full text-orange-600 dark:text-orange-400 text-sm">
                    <Flame className="w-3 h-3" />
                    连击达人
                  </div>
                )}
                {overallAccuracy >= 80 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-full text-indigo-600 dark:text-indigo-400 text-sm">
                    <TrendingUp className="w-3 h-3" />
                    高正确率
                  </div>
                )}
                {totalQuestions >= 10 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-full text-purple-600 dark:text-purple-400 text-sm">
                    <Sparkles className="w-3 h-3" />
                    全部完成
                  </div>
                )}
                {avgTimePerQuestion <= 30 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-full text-cyan-600 dark:text-cyan-400 text-sm">
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
            <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-6 mb-6">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                学习建议
              </h3>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={onRestart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-6 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              再来一轮
            </Button>
            {onGoReview && (wrongCountProp !== undefined ? wrongCountProp : wrongCount) > 0 ? (
              <Button
                onClick={onGoReview}
                variant="outline"
                className="border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 py-6 cursor-pointer"
              >
                <BookMarked className="w-5 h-5 mr-2" />
                复习错题 ({wrongCountProp !== undefined ? wrongCountProp : wrongCount})
              </Button>
            ) : (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 py-6 cursor-pointer"
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
