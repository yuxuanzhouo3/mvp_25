"use client"

import { Progress } from "@/components/ui/progress"
import { Flame, CheckCircle, XCircle, Target, AlertTriangle, Sparkles } from "lucide-react"
import { type UserRankState } from "@/lib/exam-mock-data"

interface RankPanelProps {
  rankState: UserRankState
  totalQuestions: number  // 总题数，用于计算满分
}

// 获取提示语
function getEncouragementMessage(rankState: UserRankState): { type: 'success' | 'warning' | 'info', message: string } | null {
  const { todayCorrect, todayWrong, currentCombo, consecutiveWrong } = rankState
  const totalAnswered = todayCorrect + todayWrong

  // 还没有答题时不显示提示
  if (totalAnswered === 0) {
    return null
  }

  // 连续答对时鼓励
  if (currentCombo >= 10) {
    return { type: 'success', message: '太厉害了！连续答对10题！' }
  }
  if (currentCombo >= 5) {
    return { type: 'success', message: '太棒了！连续答对5题！' }
  }
  if (currentCombo >= 3) {
    return { type: 'success', message: '继续保持，势头很好！' }
  }

  // 连续错误时警告
  if (consecutiveWrong >= 5) {
    return { type: 'warning', message: `已连错${consecutiveWrong}题，放慢节奏！` }
  }
  if (consecutiveWrong >= 3) {
    return { type: 'warning', message: `已连错${consecutiveWrong}题，请细心作答` }
  }

  // 错误较多时提醒
  if (todayWrong >= 5) {
    return { type: 'warning', message: '错误较多，仔细审题哦' }
  }

  // 默认鼓励
  return { type: 'info', message: '加油，每道题都是进步！' }
}

export function RankPanel({ rankState, totalQuestions }: RankPanelProps) {
  // 计算满分：每题10分
  const maxScore = totalQuestions * 10
  // 当前得分
  const currentScore = rankState.points
  // 得分进度百分比
  const scoreProgress = maxScore > 0 ? Math.min((currentScore / maxScore) * 100, 100) : 0
  // 提示语
  const encouragement = getEncouragementMessage(rankState)

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 lg:p-5 space-y-4">
      {/* 得分显示 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">当前得分</span>
          </div>
          <div className="text-right">
            <span className="text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{currentScore}</span>
            <span className="text-sm text-neutral-400 dark:text-neutral-500"> / {maxScore}</span>
          </div>
        </div>
        <Progress value={scoreProgress} className="h-2" />
      </div>

      {/* 分隔线 */}
      <div className="border-t border-neutral-200 dark:border-neutral-800" />

      {/* 本次统计：答对/答错 */}
      <div>
        <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">本次统计</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{rankState.todayCorrect}</span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">答对</span>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{rankState.todayWrong}</span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">答错</span>
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-neutral-200 dark:border-neutral-800" />

      {/* 连击计数 - 只有连击时才显示 */}
      {rankState.currentCombo > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" />
            <span className="text-orange-600 dark:text-orange-400 font-bold">连续答对 x{rankState.currentCombo}</span>
          </div>
          {rankState.maxCombo > 0 && (
            <p className="text-xs text-neutral-500 mt-2">
              最高连击: {rankState.maxCombo}
            </p>
          )}
        </div>
      )}

      {/* 提示语 - 只有答题后才显示 */}
      {encouragement && (
        <>
          {rankState.currentCombo > 0 && <div className="border-t border-neutral-200 dark:border-neutral-800" />}
          <div className={`p-3 rounded-xl text-center ${
            encouragement.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
              : encouragement.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {encouragement.type === 'success' ? (
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : encouragement.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className={`text-sm font-medium ${
                encouragement.type === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : encouragement.type === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {encouragement.message}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
