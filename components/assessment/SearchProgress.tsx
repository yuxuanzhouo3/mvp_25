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
import { useT } from "@/lib/i18n"

type SearchStep = 'searching' | 'analyzing' | 'generating' | 'completed'

interface SearchProgressProps {
  subjectName: string
}

export function SearchProgress({ subjectName }: SearchProgressProps) {
  const t = useT()
  const [currentStep, setCurrentStep] = useState<SearchStep>('searching')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // 模拟进度更新（每阶段1.5秒）
    const stepKeys: SearchStep[] = ['searching', 'analyzing', 'generating', 'completed']
    let stepIndex = 0

    const timer = setInterval(() => {
      if (stepIndex < stepKeys.length) {
        setCurrentStep(stepKeys[stepIndex])
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
      title: t.searchProgress.steps.search,
      description: t.searchProgress.steps.searchDesc.replace("{subject}", subjectName),
    },
    {
      key: 'analyzing',
      icon: BookOpen,
      title: t.searchProgress.steps.analyze,
      description: t.searchProgress.steps.analyzeDesc,
    },
    {
      key: 'generating',
      icon: Sparkles,
      title: t.searchProgress.steps.generate,
      description: t.searchProgress.steps.generateDesc,
    },
    {
      key: 'completed',
      icon: CheckCircle2,
      title: t.searchProgress.steps.done,
      description: t.searchProgress.steps.doneDesc,
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
            <h2 className="text-xl font-bold text-foreground">{t.searchProgress.title}</h2>
            <p className="text-sm text-muted-foreground">{t.searchProgress.subtitle}</p>
          </div>
        </div>

        {/* 总体进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.searchProgress.overallProgress}</span>
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
                        {t.searchProgress.inProgress}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-secondary text-foreground border border-border hover:bg-secondary/80">
                        {t.searchProgress.completed}
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
            {t.searchProgress.pleaseWait}
          </p>
        </div>
      </Card>
    </div>
  )
}
