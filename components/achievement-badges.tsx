"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Star, Users, Share2, Target, Zap, Brain } from "lucide-react"

interface AchievementBadgesProps {
  achievements: string[]
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  const allAchievements = [
    {
      id: "assessment_complete",
      name: "技能评估完成者",
      description: "完成首次技能评估",
      icon: <Target className="w-4 h-4" />,
      color: "from-blue-500 to-blue-600",
      unlocked: achievements.includes("技能评估完成者"),
    },
    {
      id: "social_sharer",
      name: "社交分享达人",
      description: "分享评估结果到社交媒体",
      icon: <Share2 className="w-4 h-4" />,
      color: "from-green-500 to-green-600",
      unlocked: achievements.includes("社交分享达人"),
    },
    {
      id: "skill_master",
      name: "技能大师",
      description: "在某个领域获得8分以上评分",
      icon: <Star className="w-4 h-4" />,
      color: "from-yellow-500 to-yellow-600",
      unlocked: achievements.includes("技能大师"),
    },
    {
      id: "community_builder",
      name: "社区建设者",
      description: "成功邀请5位好友加入",
      icon: <Users className="w-4 h-4" />,
      color: "from-purple-500 to-purple-600",
      unlocked: achievements.includes("社区建设者"),
    },
    {
      id: "learning_enthusiast",
      name: "学习狂热者",
      description: "连续7天完成学习任务",
      icon: <Zap className="w-4 h-4" />,
      color: "from-orange-500 to-orange-600",
      unlocked: achievements.includes("学习狂热者"),
    },
    {
      id: "top_performer",
      name: "顶尖表现者",
      description: "竞争力指数达到90分以上",
      icon: <Award className="w-4 h-4" />,
      color: "from-red-500 to-red-600",
      unlocked: achievements.includes("顶尖表现者"),
    },
    {
      id: "ai_coach_user",
      name: "AI教练体验者",
      description: "首次使用AI教练功能",
      icon: <Brain className="w-4 h-4" />,
      color: "from-green-500 to-teal-600",
      unlocked: achievements.includes("AI教练体验者"),
    },
    {
      id: "efficiency_master",
      name: "效率大师",
      description: "AI教练评分达到90分以上",
      icon: <Zap className="w-4 h-4" />,
      color: "from-yellow-500 to-orange-600",
      unlocked: achievements.includes("效率大师"),
    },
  ]

  const unlockedCount = allAchievements.filter((achievement) => achievement.unlocked).length

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-400" />
          成就徽章
        </h3>
        <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">
          {unlockedCount}/{allAchievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {allAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border transition-all ${
              achievement.unlocked
                ? "border-yellow-500/50 bg-yellow-500/10"
                : "border-slate-600 bg-slate-700/50 opacity-50"
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div
                className={`p-1 rounded-full ${
                  achievement.unlocked
                    ? `bg-gradient-to-r ${achievement.color} text-white`
                    : "bg-slate-600 text-slate-400"
                }`}
              >
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium truncate ${achievement.unlocked ? "text-white" : "text-slate-400"}`}
                >
                  {achievement.name}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400">{achievement.description}</div>
          </div>
        ))}
      </div>

      {/* Progress Incentive */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg">
        <div className="text-sm text-purple-200 text-center">🎯 解锁更多成就获得专属奖励！</div>
      </div>
    </Card>
  )
}
