"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, TrendingDown, X, BookOpen, RotateCcw } from "lucide-react"
import { RANK_CONFIG, type RankType } from "@/lib/exam-mock-data"

interface DemotionWarningProps {
  isOpen: boolean
  warningLevel: 1 | 2 | 3
  currentRank: RankType
  newRank?: RankType
  consecutiveWrong: number
  cheatDetected?: boolean
  cheatMessage?: string
  onClose: () => void
  onGoReview?: () => void
}

export function DemotionWarning({
  isOpen,
  warningLevel,
  currentRank,
  newRank,
  consecutiveWrong,
  cheatDetected = false,
  cheatMessage,
  onClose,
  onGoReview
}: DemotionWarningProps) {
  if (!isOpen) return null

  const currentConfig = RANK_CONFIG[currentRank]
  const newConfig = newRank ? RANK_CONFIG[newRank] : null

  // 根据警告级别设置样式和内容
  const getWarningStyle = () => {
    if (cheatDetected) {
      return {
        borderColor: 'border-red-500/50',
        bgColor: 'bg-red-500/20',
        iconColor: 'text-red-400',
        title: '🚨 检测到异常答题行为',
        message: cheatMessage || '系统检测到你的答题行为异常，请认真答题！'
      }
    }

    switch (warningLevel) {
      case 1:
        return {
          borderColor: 'border-yellow-500/50',
          bgColor: 'bg-yellow-500/20',
          iconColor: 'text-yellow-400',
          title: '⚠️ 注意',
          message: `你已连续答错 ${consecutiveWrong} 题，请仔细阅读题目。继续答错可能影响你的等级哦~`
        }
      case 2:
        return {
          borderColor: 'border-orange-500/50',
          bgColor: 'bg-orange-500/20',
          iconColor: 'text-orange-400',
          title: '⚠️ 警告',
          message: `你已连续答错 ${consecutiveWrong} 题！再错 1 题你的等级将降级。建议先去复习错题本，巩固薄弱知识点。`
        }
      case 3:
        return {
          borderColor: 'border-red-500/50',
          bgColor: 'bg-red-500/20',
          iconColor: 'text-red-400',
          title: '😢 很遗憾',
          message: `由于连续答错，你的等级已从 ${currentConfig.name} 降为 ${newConfig?.name}。不要气馁，去错题本复习一下，很快就能升回来！`
        }
      default:
        return {
          borderColor: 'border-slate-600',
          bgColor: 'bg-slate-700/50',
          iconColor: 'text-slate-400',
          title: '提示',
          message: ''
        }
    }
  }

  const style = getWarningStyle()

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className={`w-full max-w-md border-2 ${style.borderColor} bg-slate-800 animate-in zoom-in-95 duration-300 ${
        warningLevel >= 2 || cheatDetected ? 'animate-shake' : ''
      }`}>
        {/* 头部 */}
        <div className={`px-6 py-4 ${style.bgColor} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {warningLevel === 3 && !cheatDetected ? (
              <TrendingDown className={`w-6 h-6 ${style.iconColor}`} />
            ) : (
              <AlertTriangle className={`w-6 h-6 ${style.iconColor}`} />
            )}
            <span className={`text-lg font-bold ${style.iconColor}`}>
              {style.title}
            </span>
          </div>
          {warningLevel < 3 && !cheatDetected && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 降级动画 - 仅在降级时显示 */}
          {warningLevel === 3 && !cheatDetected && newConfig && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${currentConfig.color} flex items-center justify-center opacity-50`}>
                <span className="text-3xl">{currentConfig.icon}</span>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${newConfig.color} flex items-center justify-center`}>
                <span className="text-3xl">{newConfig.icon}</span>
              </div>
            </div>
          )}

          {/* 消息 */}
          <p className="text-slate-300 text-center mb-6 leading-relaxed">
            {style.message}
          </p>

          {/* 提示 */}
          {(warningLevel >= 2 || cheatDetected) && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-400 text-center">
                💡 <span className="text-slate-300">建议:</span> 不要着急，静下心来认真审题，或者先去错题本复习薄弱知识点。
              </p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            {onGoReview && (
              <Button
                variant="outline"
                onClick={onGoReview}
                className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                去复习错题
              </Button>
            )}
            <Button
              onClick={onClose}
              className={`flex-1 ${
                warningLevel === 3
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : warningLevel === 2 || cheatDetected
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {warningLevel === 3 ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  继续练习
                </>
              ) : cheatDetected ? (
                '我会认真答题'
              ) : (
                '我知道了'
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 添加抖动动画 */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
