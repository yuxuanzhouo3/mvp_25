"use client"

import { useState } from "react"
import { SkillAssessment } from "@/components/skill-assessment"
import { RoleClassification } from "@/components/role-classification"
import { CompetitivenessReport } from "@/components/competitiveness-report"
import { LearningPathGenerator } from "@/components/learning-path-generator"
import { ShareModal } from "@/components/share-modal"
import { UpgradeModal } from "@/components/upgrade-modal"
import { AchievementBadges } from "@/components/achievement-badges"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Crown, Share2, TrendingUp, Brain, GraduationCap, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { AiCoachModal } from "@/components/ai-coach-modal"

interface UserSkills {
  [category: string]: {
    [skill: string]: number
  }
}

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

export default function HomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"assessment" | "results" | "paths">("assessment")
  const [userSkills, setUserSkills] = useState<UserSkills>({})
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "user_123",
    name: "Alex Chen",
    role: "",
    competitivenessScore: 0,
    isPremium: false,
    assessmentProgress: 0,
    achievements: [],
    weeklyRank: 0,
  })
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const [aiCoachSessions, setAiCoachSessions] = useState(0) // 免费用户3次体验
  const [showAiCoach, setShowAiCoach] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const handleAssessmentComplete = (skills: UserSkills, role: string, score: number) => {
    setUserSkills(skills)
    setUserProfile((prev) => ({
      ...prev,
      role,
      competitivenessScore: score,
      assessmentProgress: 100,
      achievements: [...prev.achievements, "技能评估完成者"],
      weeklyRank: Math.floor(Math.random() * 100) + 1,
    }))
    setCurrentStep("results")
  }

  const handleUpgradeSuccess = () => {
    setUserProfile((prev) => ({ ...prev, isPremium: true }))
    setCurrentStep("paths")
    setShowUpgradeModal(false)
  }

  const handleStartAiCoach = () => {
    if (!userProfile.isPremium && aiCoachSessions >= 3) {
      setShowUpgradeModal(true)
      return
    }
    setShowAiCoach(true)
  }

  const handleAiCoachComplete = (sessionData: any) => {
    if (!userProfile.isPremium) {
      setAiCoachSessions((prev) => prev + 1)
    }
    setUserProfile((prev) => ({
      ...prev,
      achievements: [...prev.achievements, "AI教练体验者"],
    }))
  }

  const handleShareSuccess = () => {
    setUserProfile((prev) => ({
      ...prev,
      achievements: [...prev.achievements, "社交分享达人"],
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SkillMap
              </div>
              <div className="text-sm text-slate-400">技能评估 · 角色定位 · 成长路径</div>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile.weeklyRank > 0 && (
                <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  周排名 #{userProfile.weeklyRank}
                </Badge>
              )}
              {userProfile.isPremium ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  升级Pro
                </Button>
              )}
              <Button
                onClick={handleStartAiCoach}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                disabled={!userProfile.role}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI教练 {!userProfile.isPremium && `(${3 - aiCoachSessions}/3)`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShareModal(true)}
                disabled={!userProfile.role}
                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享成果
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">发现你的技能优势</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-400">完成度</div>
              <div className="w-32">
                <Progress value={userProfile.assessmentProgress} className="h-2" />
              </div>
              <div className="text-sm text-white font-medium">{userProfile.assessmentProgress}%</div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                currentStep === "assessment"
                  ? "bg-blue-600 text-white"
                  : userProfile.assessmentProgress > 0
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-slate-400"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>技能评估</span>
            </div>
            <div className="w-8 h-px bg-slate-600" />
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                currentStep === "results"
                  ? "bg-blue-600 text-white"
                  : userProfile.role
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-slate-400"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>角色定位</span>
            </div>
            <div className="w-8 h-px bg-slate-600" />
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                currentStep === "paths"
                  ? "bg-blue-600 text-white"
                  : userProfile.isPremium
                    ? "bg-green-600 text-white"
                    : "bg-slate-700 text-slate-400"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>学习路径</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AchievementBadges achievements={userProfile.achievements} />

            {userProfile.role && (
              <Card className="bg-slate-800/50 border-slate-700 p-4 mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">快速统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">角色定位</span>
                    <span className="text-white font-medium">{userProfile.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">竞争力指数</span>
                    <span className="text-blue-400 font-bold">{userProfile.competitivenessScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">超越用户</span>
                    <span className="text-green-400 font-medium">{userProfile.competitivenessScore}%</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {currentStep === "assessment" && (
              <>
                {/* 智能备考入口卡片 */}
                <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30 p-5 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          智能备考系统
                          <Badge className="bg-purple-600/50 text-purple-200 border-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            NEW
                          </Badge>
                        </h3>
                        <p className="text-slate-400 text-sm">AI 精准出题 · 游戏化闯关 · 错题智能讲解</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/exam')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 whitespace-nowrap"
                    >
                      开始备考
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>

                <SkillAssessment onComplete={handleAssessmentComplete} />
              </>
            )}

            {currentStep === "results" && (
              <Tabs defaultValue="classification" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                  <TabsTrigger value="classification" className="data-[state=active]:bg-blue-600">
                    角色分析
                  </TabsTrigger>
                  <TabsTrigger value="competitiveness" className="data-[state=active]:bg-blue-600">
                    竞争力报告
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="classification" className="mt-6">
                  <RoleClassification
                    userSkills={userSkills}
                    role={userProfile.role}
                    score={userProfile.competitivenessScore}
                    onUpgrade={() => setShowUpgradeModal(true)}
                  />
                </TabsContent>

                <TabsContent value="competitiveness" className="mt-6">
                  <CompetitivenessReport
                    userSkills={userSkills}
                    role={userProfile.role}
                    score={userProfile.competitivenessScore}
                    rank={userProfile.weeklyRank}
                  />
                </TabsContent>
              </Tabs>
            )}

            {currentStep === "paths" && userProfile.isPremium && (
              <LearningPathGenerator userSkills={userSkills} role={userProfile.role} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        userProfile={userProfile}
        userSkills={userSkills}
        onShareSuccess={handleShareSuccess}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
        currentRole={userProfile.role}
      />
      <AiCoachModal
        isOpen={showAiCoach}
        onClose={() => setShowAiCoach(false)}
        userProfile={userProfile}
        userSkills={userSkills}
        onComplete={handleAiCoachComplete}
        sessionsLeft={userProfile.isPremium ? -1 : 3 - aiCoachSessions}
      />
    </div>
  )
}
