"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Award,
  Target,
  Users,
  Zap,
  Star,
  ChevronRight
} from "lucide-react"

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

interface CompetitivenessReportProps {
  userSkills: UserSkills
  role: string
  score: number
  rank: number
}

// 获取竞争力等级
function getCompetitivenessLevel(score: number): {
  level: string
  color: string
  bgColor: string
  description: string
} {
  if (score >= 90) {
    return {
      level: "卓越",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      description: "您的能力处于顶尖水平，超越了绝大多数竞争者"
    }
  }
  if (score >= 75) {
    return {
      level: "优秀",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      description: "您的能力表现优秀，具有明显的竞争优势"
    }
  }
  if (score >= 60) {
    return {
      level: "良好",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      description: "您的能力处于中上水平，有提升空间"
    }
  }
  if (score >= 40) {
    return {
      level: "一般",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      description: "您的能力处于中等水平，建议针对性提升"
    }
  }
  return {
    level: "待提升",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    description: "您的能力有较大提升空间，建议系统学习"
  }
}

// 分析技能数据
function analyzeSkills(userSkills: UserSkills) {
  const allSkills: { name: string; score: number; category: string }[] = []

  Object.entries(userSkills).forEach(([category, skills]) => {
    Object.entries(skills).forEach(([skillName, score]) => {
      allSkills.push({ name: skillName, score, category })
    })
  })

  // 排序获取优势和劣势
  const sorted = [...allSkills].sort((a, b) => b.score - a.score)
  const strengths = sorted.slice(0, 3)
  const weaknesses = sorted.slice(-3).reverse()

  // 计算平均分
  const avgScore = allSkills.length > 0
    ? Math.round(allSkills.reduce((sum, s) => sum + s.score, 0) / allSkills.length)
    : 0

  return { allSkills, strengths, weaknesses, avgScore }
}

export function CompetitivenessReport({
  userSkills,
  role,
  score,
  rank
}: CompetitivenessReportProps) {
  const levelInfo = getCompetitivenessLevel(score)
  const { strengths, weaknesses, avgScore } = analyzeSkills(userSkills)

  // 计算超越百分比
  const beatPercentage = Math.min(99, Math.max(1, score))

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 竞争力概览卡片 */}
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 p-6 overflow-hidden relative">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">竞争力分析报告</h2>
              <p className="text-slate-400">
                基于您的技能评估，为您生成个性化竞争力分析
              </p>
            </div>
            <Badge className={`${levelInfo.bgColor} ${levelInfo.color} border-0 text-lg px-4 py-2`}>
              <Award className="w-5 h-5 mr-2" />
              {levelInfo.level}
            </Badge>
          </div>

          {/* 核心指标 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 竞争力指数 */}
            <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${score * 2.51} 251`}
                    strokeLinecap="round"
                    className={levelInfo.color}
                  />
                </svg>
                <span className="absolute text-3xl font-bold text-white">{score}</span>
              </div>
              <p className="text-slate-400 text-sm">竞争力指数</p>
            </div>

            {/* 周排名 */}
            <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-yellow-400">#{rank}</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">本周排名</p>
            </div>

            {/* 超越百分比 */}
            <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-green-400">{beatPercentage}%</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">超越用户</p>
            </div>
          </div>

          {/* 等级描述 */}
          <div className={`mt-6 p-4 rounded-xl ${levelInfo.bgColor} border border-slate-700/50`}>
            <p className={`${levelInfo.color} text-center`}>
              <Zap className="w-4 h-4 inline mr-2" />
              {levelInfo.description}
            </p>
          </div>
        </div>
      </Card>

      {/* 优势与劣势对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 优势技能 */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">核心优势</h3>
              <p className="text-xs text-slate-400">您的竞争壁垒</p>
            </div>
          </div>

          <div className="space-y-4">
            {strengths.length > 0 ? (
              strengths.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{skill.name}</span>
                    </div>
                    <span className="text-green-400 font-bold">{skill.score}%</span>
                  </div>
                  <Progress value={skill.score} className="h-2 bg-slate-700" />
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">完成评估后查看您的优势</p>
            )}
          </div>
        </Card>

        {/* 待提升技能 */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">提升空间</h3>
              <p className="text-xs text-slate-400">重点突破方向</p>
            </div>
          </div>

          <div className="space-y-4">
            {weaknesses.length > 0 ? (
              weaknesses.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{skill.name}</span>
                    </div>
                    <span className="text-orange-400 font-bold">{skill.score}%</span>
                  </div>
                  <Progress value={skill.score} className="h-2 bg-slate-700" />
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">完成评估后查看提升方向</p>
            )}
          </div>
        </Card>
      </div>

      {/* 市场竞争分析 */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">市场竞争力分析</h3>
            <p className="text-xs text-slate-400">与同类型用户对比</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 竞争力分布图 */}
          <div className="relative h-8 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 opacity-30"
              style={{ width: "100%" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all duration-500"
              style={{ left: `calc(${score}% - 8px)` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>较弱</span>
            <span>中等</span>
            <span>优秀</span>
            <span>卓越</span>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{role || "未定位"}</p>
              <p className="text-xs text-slate-400 mt-1">角色定位</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{avgScore}%</p>
              <p className="text-xs text-slate-400 mt-1">平均技能分</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{Object.keys(userSkills).length}</p>
              <p className="text-xs text-slate-400 mt-1">评估领域</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 提升建议 */}
      <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">个性化提升建议</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              {weaknesses.length > 0 && (
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>
                    重点提升 <span className="text-orange-400 font-medium">{weaknesses[0]?.name}</span>，
                    这将显著提高您的整体竞争力
                  </span>
                </li>
              )}
              {strengths.length > 0 && (
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>
                    持续强化 <span className="text-green-400 font-medium">{strengths[0]?.name}</span>，
                    保持您的核心竞争优势
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>建议使用 AI 教练功能，获取个性化学习指导</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
