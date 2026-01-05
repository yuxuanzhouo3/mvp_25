"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Star } from "lucide-react"

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

interface LearningPath {
  goal: string
  timeline: string
  phases: Array<{
    name: string
    duration: string
    skills: Array<{
      name: string
      priority: number
      estimatedHours: number
      resources: string[]
    }>
  }>
  dailyPlan: Array<{
    day: string
    tasks: string[]
    timeSlots: Array<{
      time: string
      activity: string
      duration: number
    }>
  }>
}

interface LearningPathGeneratorProps {
  userSkills: UserSkills
  role: string
}

export function LearningPathGenerator({ userSkills, role }: LearningPathGeneratorProps) {
  const [customGoal, setCustomGoal] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPath, setGeneratedPath] = useState<LearningPath | null>(null)
  const [selectedPhase, setSelectedPhase] = useState(0)

  const goalExamples = [
    "转行AI产品经理",
    "3个月掌握量化交易",
    "成为区块链全栈开发者",
    "提升系统架构设计能力",
    "掌握云原生开发技术栈",
    "成为数据科学专家",
  ]

  const generateLearningPath = async (goal: string) => {
    setIsGenerating(true)

    // Simulate AI generation with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Mock LLM-generated learning path
    const mockPath: LearningPath = {
      goal,
      timeline: "12周学习计划",
      phases: [
        {
          name: "基础建设阶段",
          duration: "4周",
          skills: [
            {
              name: "Python编程进阶",
              priority: 5,
              estimatedHours: 40,
              resources: ["Python官方文档", "Real Python教程", "LeetCode练习"],
            },
            {
              name: "数据结构与算法",
              priority: 4,
              estimatedHours: 35,
              resources: ["算法导论", "LeetCode", "牛客网"],
            },
            {
              name: "机器学习基础",
              priority: 5,
              estimatedHours: 45,
              resources: ["Scikit-learn文档", "Coursera ML课程", "Kaggle Learn"],
            },
          ],
        },
        {
          name: "核心技能阶段",
          duration: "5周",
          skills: [
            {
              name: "深度学习框架",
              priority: 5,
              estimatedHours: 50,
              resources: ["TensorFlow官方教程", "PyTorch文档", "Fast.ai课程"],
            },
            {
              name: "数据处理与分析",
              priority: 4,
              estimatedHours: 30,
              resources: ["Pandas文档", "NumPy教程", "数据清洗实战"],
            },
            {
              name: "模型评估与优化",
              priority: 4,
              estimatedHours: 25,
              resources: ["模型评估指南", "超参数调优", "交叉验证"],
            },
          ],
        },
        {
          name: "实战应用阶段",
          duration: "3周",
          skills: [
            {
              name: "端到端项目开发",
              priority: 5,
              estimatedHours: 60,
              resources: ["GitHub项目模板", "部署指南", "最佳实践"],
            },
            {
              name: "模型部署与监控",
              priority: 4,
              estimatedHours: 25,
              resources: ["Docker容器化", "云平台部署", "监控系统"],
            },
          ],
        },
      ],
      dailyPlan: [
        {
          day: "周一",
          tasks: ["Python语法复习", "算法题练习", "机器学习理论学习"],
          timeSlots: [
            { time: "09:00-10:30", activity: "Python编程练习", duration: 90 },
            { time: "14:00-15:30", activity: "算法题解", duration: 90 },
            { time: "19:00-20:00", activity: "机器学习理论", duration: 60 },
          ],
        },
        {
          day: "周二",
          tasks: ["数据结构实现", "Scikit-learn实践", "项目代码review"],
          timeSlots: [
            { time: "09:00-10:30", activity: "数据结构编程", duration: 90 },
            { time: "14:00-15:30", activity: "ML模型训练", duration: 90 },
            { time: "19:00-20:00", activity: "代码review", duration: 60 },
          ],
        },
      ],
    }

    setGeneratedPath(mockPath)
    setIsGenerating(false)
  }

  const handleGoalSubmit = () => {
    if (customGoal.trim()) {
      generateLearningPath(customGoal)
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return "text-red-400 bg-red-500/20"
    if (priority >= 4) return "text-yellow-400 bg-yellow-500/20"
    return "text-green-400 bg-green-500/20"
  }

  const getPriorityStars = (priority: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < priority ? "text-yellow-400 fill-current" : "text-slate-600"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Goal Input */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-400" />
          AI学习路径生成器
        </h2>
        <p className="text-purple-200 mb-6">
          基于你的 <strong>{role}</strong> 技能评估，AI将为你生成个性化的学习计划
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">描述你的学习目标</label>
            <Textarea
              placeholder="例如：我想在3个月内转行成为AI产品经理，需要掌握机器学习基础、产品设计和项目管理..."
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-[120px]"
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoalSubmit}
              disabled={isGenerating}
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60"
            >
              {isGenerating ? "生成中..." : "生成学习路径"}
            </button>
          </div>

        </div>
      </div>
    </Card>
    {generatedPath && (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-white">{generatedPath.goal}</h3>
        <p className="text-slate-200 mb-4">时间线：{generatedPath.timeline}</p>
        <div className="space-y-2">
          {generatedPath.phases.map((phase, idx) => (
            <div key={idx} className="text-slate-200">
              <span className="font-medium text-white">{phase.name}</span> · {phase.duration}
            </div>
          ))}
        </div>
      </Card>
    )}
  </div>
  )
}