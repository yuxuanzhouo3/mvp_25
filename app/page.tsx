"use client"

import { useState, useEffect } from "react"
import { SkillAssessment } from "@/components/skill-assessment"
import { DynamicSkillAssessment } from "@/components/dynamic-skill-assessment"
import { RoleClassification } from "@/components/role-classification"
import { CompetitivenessReport } from "@/components/competitiveness-report"
import { LearningPathGenerator } from "@/components/learning-path-generator"
import { ShareModal } from "@/components/share-modal"
import { UpgradeModal } from "@/components/upgrade-modal"
import { BannerAd } from "@/components/banner-ad"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Crown, BookMarked, TrendingUp, Brain, Loader2, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { AiCoachModal } from "@/components/ai-coach-modal"
import { isChinaRegion } from "@/lib/config/region"
import { useAuth as useAuthCN } from "@/components/auth/auth-provider"
import { useUserIntl } from "@/components/user-context-intl"
import { UserAvatarMenu } from "@/components/navigation/user-avatar-menu"
import { LanguageSwitcher } from "@/components/navigation/language-switcher"
import { ModeToggle } from "@/components/ModeToggle"
import { useT } from "@/lib/i18n"

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

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
  const { isAuthenticated, isLoading, user } = useAuth()
  const t = useT()
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

  // 认证检查：未登录时重定向到登录页
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // 当用户信息加载完成后，更新 userProfile
  useEffect(() => {
    if (user) {
      setUserProfile((prev) => ({
        ...prev,
        id: user.id || prev.id,
        name: user.name || user.email?.split("@")[0] || prev.name,
        isPremium: user.pro === true,
      }))
    }
  }, [user])

  // 加载中显示骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  // 未登录时返回 null（等待重定向）
  if (!isAuthenticated) {
    return null
  }

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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-neutral-950 dark:text-white">
                SkillMap
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.home.tagline}</div>
            </div>
            <div className="flex items-center space-x-3">
              {userProfile.weeklyRank > 0 && (
                <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {t.home.weeklyRank} #{userProfile.weeklyRank}
                </Badge>
              )}
              {userProfile.isPremium ? (
                <Badge className="bg-indigo-600 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t.home.upgradePro}
                </Button>
              )}
              <LanguageSwitcher />
              <ModeToggle />
              <Button
                onClick={handleStartAiCoach}
                variant="outline"
                className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                disabled={!userProfile.role}
              >
                <Brain className="w-4 h-4 mr-2" />
                {t.home.aiCoach} {!userProfile.isPremium && `(${3 - aiCoachSessions}/3)`}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/exam/review')}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <BookMarked className="w-4 h-4 mr-2" />
                {t.home.viewWrongBook}
              </Button>
              <UserAvatarMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">{t.home.discoverSkills}</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                currentStep === "assessment"
                  ? "bg-indigo-600 text-white"
                  : userProfile.assessmentProgress > 0
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>{t.home.skillAssessment}</span>
            </div>
            <div className="w-8 h-px bg-neutral-300 dark:bg-neutral-700" />
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                currentStep === "results"
                  ? "bg-indigo-600 text-white"
                  : userProfile.role
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>{t.home.rolePositioning}</span>
            </div>
            <div className="w-8 h-px bg-neutral-300 dark:bg-neutral-700" />
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                currentStep === "paths"
                  ? "bg-indigo-600 text-white"
                  : userProfile.isPremium
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>{t.home.learningPath}</span>
            </div>
          </div>
        </div>

        {/* 横幅广告 */}
        <BannerAd onUpgrade={() => setShowUpgradeModal(true)} />

        {/* Main Content */}
        <div className="w-full">
            {currentStep === "assessment" && (
              <DynamicSkillAssessment />
            )}

            {currentStep === "results" && (
              <div className="space-y-6">
                {/* 返回按钮 */}
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep("assessment")
                      setUserProfile(prev => ({
                        ...prev,
                        role: "",
                        competitivenessScore: 0,
                        assessmentProgress: 0,
                        weeklyRank: 0,
                      }))
                      setUserSkills({})
                    }}
                    className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    {t.home.backToHome}
                  </Button>
                </div>

                <Tabs defaultValue="classification" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <TabsTrigger value="classification" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 data-[state=active]:text-indigo-600">
                    {t.home.roleAnalysis}
                  </TabsTrigger>
                  <TabsTrigger value="competitiveness" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 data-[state=active]:text-indigo-600">
                    {t.home.competitivenessReport}
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
              </div>
            )}

            {currentStep === "paths" && userProfile.isPremium && (
              <LearningPathGenerator userSkills={userSkills} role={userProfile.role} />
            )}
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
