"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Monitor,
  Eye,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  BarChart3,
  Lightbulb,
  Zap,
} from "lucide-react"

interface UserProfile {
  id: string
  name: string
  role: string
  competitivenessScore: number
  isPremium: boolean
  assessmentProgress: number
  achievements: string[]
  weeklyRank: number
}

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

interface MonitoringData {
  activeWindow: string
  timeSpent: number
  productivity: number
  distractions: number
  focusScore: number
  learningActivities: Array<{
    activity: string
    duration: number
    category: string
    effectiveness: number
  }>
}

interface AiCoachModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: UserProfile
  userSkills: UserSkills
  onComplete: (sessionData: any) => void
  sessionsLeft: number // -1 for unlimited (premium)
}

export function AiCoachModal({
  isOpen,
  onClose,
  userProfile,
  userSkills,
  onComplete,
  sessionsLeft,
}: AiCoachModalProps) {
  const [currentStep, setCurrentStep] = useState<"setup" | "monitoring" | "analysis" | "recommendations">("setup")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitoringTime, setMonitoringTime] = useState(0)
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    activeWindow: "VS Code",
    timeSpent: 0,
    productivity: 0,
    distractions: 0,
    focusScore: 0,
    learningActivities: [],
  })
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  // 模拟桌面监控数据
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isMonitoring) {
      interval = setInterval(() => {
        setMonitoringTime((prev) => prev + 1)

        // 模拟实时数据更新
        setMonitoringData((prev) => {
          const newActivity = generateRandomActivity()
          const productivity = calculateProductivity(prev.learningActivities.concat(newActivity))

          return {
            ...prev,
            activeWindow: getRandomWindow(),
            timeSpent: prev.timeSpent + 1,
            productivity,
            distractions: prev.distractions + (Math.random() > 0.8 ? 1 : 0),
            focusScore: Math.max(0, Math.min(100, productivity - prev.distractions * 5)),
            learningActivities: [...prev.learningActivities, newActivity].slice(-20), // 保留最近20个活动
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isMonitoring])

  const generateRandomActivity = () => {
    const activities = [
      { activity: "编写代码", category: "编程实践", effectiveness: 85 },
      { activity: "阅读文档", category: "学习理论", effectiveness: 70 },
      { activity: "观看教程", category: "视频学习", effectiveness: 75 },
      { activity: "调试程序", category: "问题解决", effectiveness: 80 },
      { activity: "浏览社交媒体", category: "分心活动", effectiveness: 10 },
      { activity: "查看邮件", category: "日常事务", effectiveness: 30 },
      { activity: "搜索解决方案", category: "研究学习", effectiveness: 65 },
    ]

    const randomActivity = activities[Math.floor(Math.random() * activities.length)]
    return {
      ...randomActivity,
      duration: Math.floor(Math.random() * 300) + 60, // 1-5分钟
    }
  }

  const getRandomWindow = () => {
    const windows = ["VS Code", "Chrome - Stack Overflow", "Terminal", "Figma", "Slack", "YouTube", "GitHub"]
    return windows[Math.floor(Math.random() * windows.length)]
  }

  const calculateProductivity = (activities: any[]) => {
    if (activities.length === 0) return 0
    const avgEffectiveness = activities.reduce((sum, act) => sum + act.effectiveness, 0) / activities.length
    return Math.round(avgEffectiveness)
  }

  const requestPermission = async () => {
    // 模拟权限请求
    setPermissionGranted(true)
    setCurrentStep("monitoring")
  }

  const startMonitoring = () => {
    setIsMonitoring(true)
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    generateAiAnalysis()
    setCurrentStep("analysis")
  }

  const generateAiAnalysis = async () => {
    // 模拟AI分析过程
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const analysis = {
      overallScore: Math.round(monitoringData.productivity * 0.8 + monitoringData.focusScore * 0.2),
      strengths: ["代码编写时间占比较高", "问题解决能力表现良好", "学习资源利用充分"],
      weaknesses: ["容易被社交媒体分散注意力", "学习时间分配不够均匀", "缺乏定期休息"],
      recommendations: [
        {
          title: "使用番茄工作法",
          description: "25分钟专注学习 + 5分钟休息，提高专注度",
          priority: "高",
          estimatedImprovement: "+15%",
        },
        {
          title: "屏蔽干扰网站",
          description: "学习期间使用网站屏蔽工具，减少分心",
          priority: "中",
          estimatedImprovement: "+10%",
        },
        {
          title: "制定学习计划",
          description: "根据技能评估结果，制定每日学习目标",
          priority: "高",
          estimatedImprovement: "+20%",
        },
      ],
      learningPath: generatePersonalizedPath(),
      nextSession: "建议3天后进行下次监控分析",
    }

    setAiAnalysis(analysis)
  }

  const generatePersonalizedPath = () => {
    // 基于用户技能和监控数据生成个性化路径
    const weakSkills = Object.entries(userSkills)
      .flatMap(([category, skills]) =>
        Object.entries(skills)
          .filter(([, score]) => score < 6)
          .map(([skill, score]) => ({ skill, score, category })),
      )
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)

    return {
      focus: "技能提升 + 学习效率优化",
      dailyGoals: [
        `提升 ${weakSkills[0]?.skill || "核心技能"} - 每日30分钟`,
        "减少分心时间至15%以下",
        "保持80%以上的专注度",
      ],
      weeklyTargets: ["完成3个实践项目", "学习效率提升25%", "技能评分提升2分"],
    }
  }

  const handleComplete = () => {
    onComplete({
      monitoringData,
      aiAnalysis,
      sessionDuration: monitoringTime,
      improvements: aiAnalysis?.recommendations || [],
    })
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Brain className="w-6 h-6 mr-2 text-green-400" />
            AI学习教练
            {sessionsLeft > 0 && (
              <Badge className="ml-2 bg-orange-600/20 text-orange-300">剩余 {sessionsLeft} 次免费体验</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Setup Step */}
        {currentStep === "setup" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border-green-500/30 p-6">
              <h3 className="text-xl font-bold text-white mb-4">🤖 AI教练功能介绍</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-green-200">
                    <Monitor className="w-5 h-5 mr-2" />
                    <span>实时桌面活动监控</span>
                  </div>
                  <div className="flex items-center text-green-200">
                    <Eye className="w-5 h-5 mr-2" />
                    <span>学习行为智能分析</span>
                  </div>
                  <div className="flex items-center text-green-200">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span>专注度实时评分</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-green-200">
                    <Target className="w-5 h-5 mr-2" />
                    <span>个性化学习建议</span>
                  </div>
                  <div className="flex items-center text-green-200">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    <span>效率优化方案</span>
                  </div>
                  <div className="flex items-center text-green-200">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    <span>学习数据可视化</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600 p-6">
              <h4 className="text-lg font-semibold text-white mb-4">隐私与权限说明</h4>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="font-medium">本地数据处理</div>
                    <div className="text-sm text-slate-400">所有监控数据仅在本地处理，不会上传到服务器</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="font-medium">可控制的监控</div>
                    <div className="text-sm text-slate-400">你可以随时开始、暂停或停止监控</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="font-medium">匿名化分析</div>
                    <div className="text-sm text-slate-400">AI分析基于行为模式，不记录具体内容</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-400 bg-transparent">
                取消
              </Button>
              <Button
                onClick={requestPermission}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                开始AI教练体验
              </Button>
            </div>
          </div>
        )}

        {/* Monitoring Step */}
        {currentStep === "monitoring" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">实时学习监控</h3>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-green-400">{formatTime(monitoringTime)}</div>
                <div className="flex space-x-2">
                  {!isMonitoring ? (
                    <Button onClick={startMonitoring} className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      开始监控
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => setIsMonitoring(false)} className="bg-yellow-600 hover:bg-yellow-700">
                        <Pause className="w-4 h-4 mr-2" />
                        暂停
                      </Button>
                      <Button onClick={stopMonitoring} className="bg-red-600 hover:bg-red-700">
                        <Square className="w-4 h-4 mr-2" />
                        停止分析
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-700/50 border-slate-600 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">当前窗口</span>
                  <Monitor className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-lg font-bold text-white truncate">{monitoringData.activeWindow}</div>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">专注度</span>
                  <Target className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-lg font-bold text-green-400">{monitoringData.focusScore}%</div>
                <Progress value={monitoringData.focusScore} className="h-1 mt-2" />
              </Card>

              <Card className="bg-slate-700/50 border-slate-600 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">生产力</span>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-lg font-bold text-purple-400">{monitoringData.productivity}%</div>
                <Progress value={monitoringData.productivity} className="h-1 mt-2" />
              </Card>

              <Card className="bg-slate-700/50 border-slate-600 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">分心次数</span>
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-lg font-bold text-orange-400">{monitoringData.distractions}</div>
              </Card>
            </div>

            <Card className="bg-slate-700/50 border-slate-600 p-6">
              <h4 className="text-lg font-semibold text-white mb-4">实时活动记录</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {monitoringData.learningActivities
                  .slice(-10)
                  .reverse()
                  .map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.effectiveness > 70
                              ? "bg-green-400"
                              : activity.effectiveness > 40
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          }`}
                        />
                        <span className="text-white">{activity.activity}</span>
                        <Badge className="bg-slate-600 text-slate-300 text-xs">{activity.category}</Badge>
                      </div>
                      <div className="text-sm text-slate-400">{Math.round(activity.duration / 60)}分钟</div>
                    </div>
                  ))}
              </div>
            </Card>

            {isMonitoring && (
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center text-blue-200">
                  <Eye className="w-5 h-5 mr-2" />
                  <span>AI正在分析你的学习模式...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Step */}
        {currentStep === "analysis" && !aiAnalysis && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">AI正在分析你的学习数据...</h3>
              <p className="text-slate-400">这可能需要几秒钟时间</p>
            </div>
          </div>
        )}

        {/* Results Step */}
        {currentStep === "analysis" && aiAnalysis && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">🎯 AI分析报告</h3>
              <div className="text-4xl font-bold text-green-400 mb-2">{aiAnalysis.overallScore}/100</div>
              <p className="text-slate-400">综合学习效率评分</p>
            </div>

            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="analysis">分析结果</TabsTrigger>
                <TabsTrigger value="recommendations">改进建议</TabsTrigger>
                <TabsTrigger value="plan">学习计划</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-700/50 border-slate-600 p-6">
                    <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      优势表现
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.strengths.map((strength: string, index: number) => (
                        <div key={index} className="flex items-center text-green-200">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
                          {strength}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 p-6">
                    <h4 className="text-lg font-semibold text-orange-400 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      改进空间
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.weaknesses.map((weakness: string, index: number) => (
                        <div key={index} className="flex items-center text-orange-200">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                          {weakness}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className="bg-slate-700/50 border-slate-600 p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">学习数据统计</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{formatTime(monitoringTime)}</div>
                      <div className="text-sm text-slate-400">总监控时间</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{monitoringData.productivity}%</div>
                      <div className="text-sm text-slate-400">平均生产力</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{monitoringData.focusScore}%</div>
                      <div className="text-sm text-slate-400">专注度评分</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{monitoringData.distractions}</div>
                      <div className="text-sm text-slate-400">分心次数</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {aiAnalysis.recommendations.map((rec: any, index: number) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                        {rec.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`${
                            rec.priority === "高"
                              ? "bg-red-600/20 text-red-300"
                              : rec.priority === "中"
                                ? "bg-yellow-600/20 text-yellow-300"
                                : "bg-green-600/20 text-green-300"
                          }`}
                        >
                          {rec.priority}优先级
                        </Badge>
                        <Badge className="bg-blue-600/20 text-blue-300">
                          <Zap className="w-3 h-3 mr-1" />
                          {rec.estimatedImprovement}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-slate-300">{rec.description}</p>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="plan" className="space-y-4">
                <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">个性化学习计划</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-white font-medium mb-2">学习重点</h5>
                      <p className="text-purple-200">{aiAnalysis.learningPath.focus}</p>
                    </div>

                    <div>
                      <h5 className="text-white font-medium mb-2">每日目标</h5>
                      <div className="space-y-1">
                        {aiAnalysis.learningPath.dailyGoals.map((goal: string, index: number) => (
                          <div key={index} className="flex items-center text-purple-200">
                            <Target className="w-4 h-4 mr-2 text-purple-400" />
                            {goal}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-white font-medium mb-2">周目标</h5>
                      <div className="space-y-1">
                        {aiAnalysis.learningPath.weeklyTargets.map((target: string, index: number) => (
                          <div key={index} className="flex items-center text-purple-200">
                            <CheckCircle className="w-4 h-4 mr-2 text-purple-400" />
                            {target}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600 p-4">
                  <div className="flex items-center text-blue-200">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{aiAnalysis.nextSession}</span>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-400 bg-transparent">
                稍后查看
              </Button>
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                完成分析
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
