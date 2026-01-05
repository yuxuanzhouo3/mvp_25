"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Zap, Users, Flame } from "lucide-react"

interface User {
  name: string
  level: number
  energy: number
  totalProgress: number
  masteredSkills: string[]
  achievements: string[]
  inviteCount: number
  dailyStreak: number
}

interface UserProfileProps {
  user: User
}

export function UserProfile({ user }: UserProfileProps) {
  const getTitleByLevel = (progress: number) => {
    if (progress >= 70) return { title: "👑 JavaScript宗师", color: "from-yellow-400 to-orange-400" }
    if (progress >= 30) return { title: "⚡ 前端新星", color: "from-blue-400 to-purple-400" }
    return { title: "🌱 萌新学徒", color: "from-green-400 to-emerald-400" }
  }

  const userTitle = getTitleByLevel(user.totalProgress)

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="space-y-6">
        {/* Avatar and Title */}
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-purple-500/30">
            <AvatarImage src="/placeholder.svg?height=80&width=80" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <div className={`text-sm font-medium bg-gradient-to-r ${userTitle.color} bg-clip-text text-transparent`}>
            {userTitle.title}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-lg font-bold text-white">{user.energy}</span>
            </div>
            <div className="text-xs text-slate-400">能量石</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-lg font-bold text-white">{user.inviteCount}</span>
            </div>
            <div className="text-xs text-slate-400">邀请数</div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">总体进度</span>
            <span className="text-sm font-medium text-white">{user.totalProgress}%</span>
          </div>
          <Progress value={user.totalProgress} className="h-2" />
        </div>

        {/* Daily Streak */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Flame className="w-4 h-4 text-orange-400 mr-2" />
              <span className="text-sm text-white">连续学习</span>
            </div>
            <span className="text-lg font-bold text-orange-400">{user.dailyStreak}天</span>
          </div>
        </div>

        {/* Top Skills */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">掌握技能</h3>
          <div className="flex flex-wrap gap-2">
            {user.masteredSkills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
