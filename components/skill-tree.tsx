"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Lock, Star } from "lucide-react"

interface SkillNode {
  id: string
  name: string
  description: string
  prerequisites: string[]
  difficulty: "beginner" | "intermediate" | "advanced"
  category: string
  x: number
  y: number
}

interface SkillTreeProps {
  onSkillComplete: (skillName: string) => void
  userProgress: number
}

export function SkillTree({ onSkillComplete, userProgress }: SkillTreeProps) {
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(
    new Set(["html-basics", "css-basics", "js-basics", "react-intro"]),
  )

  const skillNodes: SkillNode[] = [
    // Frontend Foundation
    {
      id: "html-basics",
      name: "HTML基础",
      description: "掌握HTML标签和语义化",
      prerequisites: [],
      difficulty: "beginner",
      category: "frontend",
      x: 1,
      y: 1,
    },
    {
      id: "css-basics",
      name: "CSS基础",
      description: "样式和布局基础",
      prerequisites: ["html-basics"],
      difficulty: "beginner",
      category: "frontend",
      x: 2,
      y: 1,
    },
    {
      id: "js-basics",
      name: "JavaScript基础",
      description: "JS语法和DOM操作",
      prerequisites: ["html-basics"],
      difficulty: "beginner",
      category: "frontend",
      x: 1,
      y: 2,
    },

    // React Path
    {
      id: "react-intro",
      name: "React入门",
      description: "组件和JSX基础",
      prerequisites: ["js-basics"],
      difficulty: "intermediate",
      category: "frontend",
      x: 2,
      y: 2,
    },
    {
      id: "react-hooks",
      name: "React Hooks",
      description: "状态管理和副作用",
      prerequisites: ["react-intro"],
      difficulty: "intermediate",
      category: "frontend",
      x: 3,
      y: 2,
    },
    {
      id: "react-router",
      name: "React Router",
      description: "单页应用路由",
      prerequisites: ["react-hooks"],
      difficulty: "intermediate",
      category: "frontend",
      x: 4,
      y: 2,
    },

    // Advanced Frontend
    {
      id: "typescript",
      name: "TypeScript",
      description: "类型安全的JavaScript",
      prerequisites: ["js-basics"],
      difficulty: "intermediate",
      category: "frontend",
      x: 1,
      y: 3,
    },
    {
      id: "nextjs",
      name: "Next.js",
      description: "全栈React框架",
      prerequisites: ["react-router", "typescript"],
      difficulty: "advanced",
      category: "fullstack",
      x: 3,
      y: 3,
    },

    // Backend Path
    {
      id: "nodejs",
      name: "Node.js",
      description: "服务端JavaScript",
      prerequisites: ["js-basics"],
      difficulty: "intermediate",
      category: "backend",
      x: 1,
      y: 4,
    },
    {
      id: "express",
      name: "Express.js",
      description: "Web应用框架",
      prerequisites: ["nodejs"],
      difficulty: "intermediate",
      category: "backend",
      x: 2,
      y: 4,
    },
    {
      id: "database",
      name: "数据库设计",
      description: "SQL和NoSQL数据库",
      prerequisites: ["nodejs"],
      difficulty: "intermediate",
      category: "backend",
      x: 3,
      y: 4,
    },

    // DevOps
    {
      id: "git",
      name: "Git版本控制",
      description: "代码版本管理",
      prerequisites: [],
      difficulty: "beginner",
      category: "devops",
      x: 5,
      y: 1,
    },
    {
      id: "docker",
      name: "Docker容器",
      description: "应用容器化",
      prerequisites: ["nodejs"],
      difficulty: "advanced",
      category: "devops",
      x: 4,
      y: 4,
    },
    {
      id: "aws",
      name: "AWS云服务",
      description: "云平台部署",
      prerequisites: ["docker"],
      difficulty: "advanced",
      category: "devops",
      x: 5,
      y: 4,
    },
  ]

  const isSkillUnlocked = (skill: SkillNode) => {
    return skill.prerequisites.every((prereq) => completedSkills.has(prereq))
  }

  const isSkillCompleted = (skillId: string) => {
    return completedSkills.has(skillId)
  }

  const handleSkillClick = (skill: SkillNode) => {
    if (!isSkillUnlocked(skill) || isSkillCompleted(skill.id)) return

    setCompletedSkills((prev) => new Set([...prev, skill.id]))
    onSkillComplete(skill.name)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "from-green-500 to-emerald-500"
      case "intermediate":
        return "from-blue-500 to-purple-500"
      case "advanced":
        return "from-orange-500 to-red-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "frontend":
        return "border-blue-500/50 bg-blue-500/10"
      case "backend":
        return "border-green-500/50 bg-green-500/10"
      case "fullstack":
        return "border-purple-500/50 bg-purple-500/10"
      case "devops":
        return "border-orange-500/50 bg-orange-500/10"
      default:
        return "border-gray-500/50 bg-gray-500/10"
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">技能树</h2>
        <p className="text-slate-400">解锁技能，成为全栈开发者</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">🌱 初级</Badge>
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">⚡ 中级</Badge>
        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">🔥 高级</Badge>
      </div>

      {/* Skill Tree Grid */}
      <div className="relative overflow-x-auto">
        <div className="grid grid-cols-5 gap-4 min-w-[800px] p-4">
          {skillNodes.map((skill) => {
            const isUnlocked = isSkillUnlocked(skill)
            const isCompleted = isSkillCompleted(skill.id)

            return (
              <div
                key={skill.id}
                className={`relative ${getCategoryColor(skill.category)} border rounded-lg p-4 transition-all duration-300 hover:scale-105 cursor-pointer`}
                style={{
                  gridColumn: skill.x,
                  gridRow: skill.y,
                  opacity: isUnlocked ? 1 : 0.5,
                }}
                onClick={() => handleSkillClick(skill)}
              >
                {/* Status Icon */}
                <div className="absolute -top-2 -right-2">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-400 bg-slate-800 rounded-full" />
                  ) : isUnlocked ? (
                    <Circle className="w-6 h-6 text-slate-400 bg-slate-800 rounded-full" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-600 bg-slate-800 rounded-full" />
                  )}
                </div>

                {/* Skill Content */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-sm">{skill.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2">{skill.description}</p>

                  {/* Difficulty Badge */}
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${getDifficultyColor(skill.difficulty)} text-white`}
                  >
                    {skill.difficulty === "beginner" && "初级"}
                    {skill.difficulty === "intermediate" && "中级"}
                    {skill.difficulty === "advanced" && "高级"}
                  </div>
                </div>

                {/* Completion Effect */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Star className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300">技能树完成度</span>
          <span className="text-white font-semibold">
            {completedSkills.size}/{skillNodes.length} ({Math.round((completedSkills.size / skillNodes.length) * 100)}%)
          </span>
        </div>
        <div className="w-full bg-slate-600 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedSkills.size / skillNodes.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
