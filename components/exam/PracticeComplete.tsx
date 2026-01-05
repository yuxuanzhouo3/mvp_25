"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Target,
  Flame,
  BookMarked,
  RotateCcw,
  Home,
  Share2,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  Award,
  Zap,
  ClipboardList
} from "lucide-react"
import { RANK_CONFIG, type UserRankState, type RankType } from "@/lib/exam-mock-data"
import confetti from 'canvas-confetti'

interface PracticeCompleteProps {
  examName: string
  rankState: UserRankState
  totalQuestions: number
  correctCount: number
  wrongCount: number
  wrongQuestionsCount: number
  onRestart: () => void
  onGoHome: () => void
  onGoReview: () => void
  onViewDetails: () => void
}

export function PracticeComplete({
  examName,
  rankState,
  totalQuestions,
  correctCount,
  wrongCount,
  wrongQuestionsCount,
  onRestart,
  onGoHome,
  onGoReview,
  onViewDetails
}: PracticeCompleteProps) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const rankConfig = RANK_CONFIG[rankState.rank]

  // 根据正确率判断评级
  const getGrade = () => {
    if (accuracy >= 90) return { grade: 'S', color: 'from-yellow-400 to-orange-500', text: '完美发挥！' }
    if (accuracy >= 80) return { grade: 'A', color: 'from-green-400 to-emerald-500', text: '表现优秀！' }
    if (accuracy >= 70) return { grade: 'B', color: 'from-blue-400 to-cyan-500', text: '良好水平！' }
    if (accuracy >= 60) return { grade: 'C', color: 'from-purple-400 to-pink-500', text: '继续努力！' }
    return { grade: 'D', color: 'from-slate-400 to-slate-500', text: '需要加油！' }
  }

  const gradeInfo = getGrade()

  // 入场动画和撒花效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
      // 正确率高于70%才撒花
      if (accuracy >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [accuracy])

  // 分数动画
  useEffect(() => {
    if (!showContent) return

    const duration = 1500
    const steps = 60
    const increment = accuracy / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= accuracy) {
        setAnimatedScore(accuracy)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [showContent, accuracy])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className={`w-full max-w-2xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* 头部 - 评级展示 */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${gradeInfo.color} shadow-2xl mb-4 animate-pulse`}>
              <span className="text-6xl font-black text-white drop-shadow-lg">{gradeInfo.grade}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{gradeInfo.text}</h1>
            <p className="text-slate-400">《{examName}》练习完成</p>
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
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${animatedScore * 4.4} 440`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-orange-400">{rankState.maxCombo}</div>
                <div className="text-xs text-slate-400">最高连击</div>
              </div>
            </div>

            {/* 等级信息 */}
            <div className={`${rankConfig.bgColor} border border-slate-600 rounded-xl p-4 mb-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankConfig.color} flex items-center justify-center text-2xl`}>
                    {rankConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{rankConfig.name}</span>
                      <Award className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-sm text-slate-400">当前等级</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xl font-bold">{rankState.points}</span>
                  </div>
                  <p className="text-xs text-slate-400">总积分</p>
                </div>
              </div>
            </div>

            {/* 今日成就 */}
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
                {rankState.maxCombo >= 3 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm">
                    <Flame className="w-3 h-3" />
                    连击达人
                  </div>
                )}
                {accuracy >= 80 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                    <TrendingUp className="w-3 h-3" />
                    高正确率
                  </div>
                )}
                {totalQuestions >= 20 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                    <Sparkles className="w-3 h-3" />
                    全部完成
                  </div>
                )}
                {correctCount === 0 && wrongCount === 0 && (
                  <span className="text-slate-500 text-sm">暂无成就</span>
                )}
              </div>
            </div>
          </Card>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              onClick={onRestart}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              再来一轮
            </Button>
            {wrongQuestionsCount > 0 && (
              <Button
                onClick={onGoReview}
                variant="outline"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 py-6"
              >
                <BookMarked className="w-5 h-5 mr-2" />
                复习错题 ({wrongQuestionsCount})
              </Button>
            )}
            {wrongQuestionsCount === 0 && (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 py-6"
              >
                <Home className="w-5 h-5 mr-2" />
                返回首页
              </Button>
            )}
          </div>

          <Button
            onClick={onViewDetails}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            查看答题详情
          </Button>
        </div>
      </div>
    </div>
  )
}
