"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Gift, Zap, Users, Share2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  reward: number
  icon: React.ReactNode
  completed: boolean
}

interface DailyTasksProps {
  onTaskComplete: (reward: number) => void
}

export function DailyTasks({ onTaskComplete }: DailyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "complete-node",
      title: "完成技能节点",
      description: "完成任意一个技能节点",
      reward: 5,
      icon: <CheckCircle className="w-4 h-4" />,
      completed: false,
    },
    {
      id: "share-achievement",
      title: "分享成就",
      description: "分享你的学习成果到社交媒体",
      reward: 8,
      icon: <Share2 className="w-4 h-4" />,
      completed: false,
    },
    {
      id: "invite-friend",
      title: "邀请好友",
      description: "邀请一位朋友加入学习",
      reward: 15,
      icon: <Users className="w-4 h-4" />,
      completed: true,
    },
  ])

  const handleTaskComplete = (taskId: string, reward: number) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: true } : task)))
    onTaskComplete(reward)
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const totalReward = tasks.reduce((sum, task) => sum + (task.completed ? task.reward : 0), 0)

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Gift className="w-5 h-5 mr-2 text-purple-400" />
            每日任务
          </h3>
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
            {completedCount}/{tasks.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                task.completed
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-slate-700/50 border-slate-600 hover:border-purple-500/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${
                    task.completed ? "bg-green-500/20 text-green-400" : "bg-slate-600 text-slate-400"
                  }`}
                >
                  {task.completed ? <CheckCircle className="w-4 h-4" /> : task.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{task.title}</div>
                  <div className="text-xs text-slate-400">{task.description}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center text-yellow-400">
                  <Zap className="w-3 h-3 mr-1" />
                  <span className="text-sm font-medium">+{task.reward}</span>
                </div>
                {!task.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTaskComplete(task.id, task.reward)}
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    完成
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Daily Summary */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">今日获得能量</span>
            <div className="flex items-center text-yellow-400 font-semibold">
              <Zap className="w-4 h-4 mr-1" />
              {totalReward}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
