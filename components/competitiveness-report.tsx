"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, Award, BarChart3 } from "lucide-react"

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

export function CompetitivenessReport({ userSkills, role, score, rank }: CompetitivenessReportProps) {
  const getSkillHeatmap = () => {
    const categories = Object.keys(userSkills)
    return categories.map((category) => {
      const skills = userSkills[category]
      const avgScore = Object.values(skills).reduce((sum, score) => sum + score, 0) / Object.values(skills).length
      return {
        category,
        avgScore,
        skillCount: Object.keys(skills).length,
        topSkill: Object.entries(skills).sort(([, a], [, b]) => b - a)[0],
      }
    })
  }

  const getMarketComparison = () => {
    // Simulated market data
    const marketData = {
      全栈工程师: { avgScore: 72, demand: 95, growth: 15 },
      前端工程师: { avgScore: 68, demand: 88, growth: 12 },
      后端工程师: { avgScore: 74, demand: 92, growth: 18 },
      数据科学家: { avgScore: 78, demand: 96, growth: 25 },
      DevOps工程师: { avgScore: 76, demand: 89, growth: 22 },
      安全工程师: { avgScore: 79, demand: 85, growth: 20 },
      通用开发者: { avgScore: 65, demand: 75, growth: 10 },
    }

    return marketData[role as keyof typeof marketData] || marketData["通用开发者"]
  }

  const getCompetitiveAdvantages = () => {
    const advantages = []
    const heatmap = getSkillHeatmap()

    // Find top performing categories
    const topCategories = heatmap.filter((cat) => cat.avgScore >= 7)
    if (topCategories.length >= 2) {
      advantages.push("多领域专业能力")
    }

    // Check for high individual scores
    const highScores = Object.values(userSkills)
      .flatMap((skills) => Object.values(skills))
      .filter((score) => score >= 8)
    if (highScores.length >= 3) {
      advantages.push("深度专业技能")
    }

    // Role-specific advantages
    if (role === "全栈工程师") {
      advantages.push("端到端开发能力")
    }
    if (score > 80) {
      advantages.push("行业顶尖水平")
    }

    return advantages.length > 0 ? advantages : ["持续学习能力", "基础扎实"]
  }

  const heatmap = getSkillHeatmap()
  const marketData = getMarketComparison()
  const advantages = getCompetitiveAdvantages()

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{score}</div>
            <div className="text-green-200">竞争力指数</div>
            <div className="text-sm text-green-300 mt-1">满分100分</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">#{rank}</div>
            <div className="text-blue-200">周排名</div>
            <div className="text-sm text-blue-300 mt-1">本周参与用户</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{score}%</div>
            <div className="text-purple-200">超越用户</div>
            <div className="text-sm text-purple-300 mt-1">同类型开发者</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{marketData.demand}%</div>
            <div className="text-yellow-200">市场需求</div>
            <div className="text-sm text-yellow-300 mt-1">岗位热度指数</div>
          </div>
        </div>
      </Card>

      {/* Skill Heatmap */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          技能热力图
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {heatmap.map((category, index) => (
            <div key={index} className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{category.category}</h4>
                <Badge
                  className={`${
                    category.avgScore >= 8
                      ? "bg-green-600/30 text-green-300"
                      : category.avgScore >= 6
                        ? "bg-yellow-600/30 text-yellow-300"
                        : "bg-red-600/30 text-red-300"
                  }`}
                >
                  {category.avgScore.toFixed(1)}
                </Badge>
              </div>
              <Progress value={category.avgScore * 10} className="h-2 mb-2" />
              <div className="text-sm text-slate-400">
                最强技能: {category.topSkill[0]} ({category.topSkill[1]}/10)
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Market Comparison */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
          市场对比分析
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">你的评分</span>
              <span className="text-white font-bold">{score}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">市场平均</span>
              <span className="text-slate-300">{marketData.avgScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">优势差距</span>
              <span className={`font-bold ${score > marketData.avgScore ? "text-green-400" : "text-orange-400"}`}>
                {score > marketData.avgScore ? "+" : ""}
                {score - marketData.avgScore}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">市场需求度</span>
              <span className="text-green-400 font-bold">{marketData.demand}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">年增长率</span>
              <span className="text-blue-400 font-bold">+{marketData.growth}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">竞争激烈度</span>
              <span className="text-yellow-400 font-bold">
                {marketData.demand > 90 ? "高" : marketData.demand > 80 ? "中" : "低"}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">市场前景</h4>
            <div className="text-sm text-blue-200">
              {marketData.growth > 20
                ? "🚀 高速增长领域，就业前景极佳"
                : marketData.growth > 15
                  ? "📈 稳定增长领域，发展机会良好"
                  : "📊 成熟领域，需要差异化竞争"}
            </div>
          </div>
        </div>
      </Card>

      {/* Competitive Advantages */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-400" />
          竞争优势分析
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">核心优势</h4>
            <div className="space-y-2">
              {advantages.map((advantage, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-green-300">{advantage}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">建议提升</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-orange-300">扩展技术栈广度</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-orange-300">加强项目实战经验</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-orange-300">提升软技能水平</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ranking Insights */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-400" />
          排名洞察
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">本周表现</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">当前排名</span>
                <span className="text-white font-bold">#{rank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">上周排名</span>
                <span className="text-slate-300">#{rank + 5}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">排名变化</span>
                <span className="text-green-400 font-bold">↑ +5</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">超越目标</h4>
            <div className="space-y-2">
              <div className="text-sm text-slate-300">
                再提升 <span className="text-blue-400 font-bold">8分</span> 可进入前10%
              </div>
              <div className="text-sm text-slate-300">
                再提升 <span className="text-purple-400 font-bold">15分</span> 可进入前5%
              </div>
              <div className="text-sm text-slate-300">
                再提升 <span className="text-yellow-400 font-bold">25分</span> 可进入前1%
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
