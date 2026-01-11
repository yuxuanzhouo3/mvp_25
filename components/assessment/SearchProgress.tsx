"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Globe,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"

type SearchStep = 'searching' | 'analyzing' | 'generating' | 'completed'

interface SearchProgressProps {
  subjectName: string
}

export function SearchProgress({ subjectName }: SearchProgressProps) {
  const [currentStep, setCurrentStep] = useState<SearchStep>('searching')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // 模拟进度更新（每阶段1.5秒）
    const steps: SearchStep[] = ['searching', 'analyzing', 'generating', 'completed']
    let stepIndex = 0

    const timer = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex])
        setProgress((stepIndex + 1) * 25)
        stepIndex++
      } else {
        clearInterval(timer)
      }
    }, 1500)

    return () => clearInterval(timer)
  }, [])

  const steps = [
    {
      key: 'searching',
      icon: Globe,
      title: '联网搜索最新信息',
      description: `正在搜索 ${subjectName} 2025年考试大纲、题型变化和热点考点`,
    },
    {
      key: 'analyzing',
      icon: BookOpen,
      title: '分析考试趋势',
      description: 'AI正在分析搜索结果，提取重点考查方向',
    },
    {
      key: 'generating',
      icon: Sparkles,
      title: '生成针对性题目',
      description: '基于最新考试信息和您的薄弱环节，智能生成题目',
    },
    {
      key: 'completed',
      icon: CheckCircle2,
      title: '生成完成',
      description: '题目已准备就绪，即将开始练习',
    }
  ]

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.key === currentStep)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部标题 */}
      <Card className="bg-card border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Search className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">AI 正在智能准备题目</h2>
            <p className="text-sm text-muted-foreground">基于最新考试信息的个性化出题</p>
          </div>
        </div>

        {/* 总体进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">总体进度</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* 步骤列表 */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep
          const isCompleted = getCurrentStepIndex() > index
          const Icon = step.icon

          return (
            <Card
              key={step.key}
              className={`
                p-5 border border-border transition-all duration-300
                ${isActive ? 'bg-secondary shadow-sm' : 'bg-card'}
                ${isCompleted ? 'opacity-60' : ''}
              `}
            >
              <div className="flex items-start gap-4">
                {/* 图标 */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200
                  ${isActive ? 'bg-secondary' : 'bg-muted'}
                  ${isCompleted ? 'bg-secondary' : ''}
                `}>
                  {isActive ? (
                    <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-foreground" />
                  ) : (
                    <Icon className="w-6 h-6 text-foreground" />
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </h3>
                    {isActive && (
                      <Badge className="bg-secondary text-foreground border border-border hover:bg-secondary/80">
                        进行中
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-secondary text-foreground border border-border hover:bg-secondary/80">
                        已完成
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 底部提示 */}
      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            AI正在联网搜索最新信息，这可能需要几秒钟，请稍候...
          </p>
        </div>
      </Card>
    </div>
  )
}
