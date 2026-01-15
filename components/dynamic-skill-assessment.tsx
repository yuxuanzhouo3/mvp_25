"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, ArrowLeft, Upload, Search, Loader2, Zap, Brain, ChevronRight } from "lucide-react"
import { getSubjectDimensions, type SubjectDimension } from "@/lib/subject-dimensions"
import { analyzeAssessmentResult } from "@/lib/types/assessment"
import { useT } from "@/lib/i18n"

interface DynamicSkillAssessmentProps {
  onComplete?: (subject: string, ratings: Record<string, number>) => void
}

// 获取等级标签
function getLevelLabel(score: number, t: ReturnType<typeof useT>): { label: string; color: string } {
  if (score <= 3) return { label: t.assessment.levels.beginner, color: "text-orange-500 dark:text-orange-400" }
  if (score <= 6) return { label: t.assessment.levels.intermediate, color: "text-indigo-600 dark:text-indigo-400" }
  if (score <= 8) return { label: t.assessment.levels.advanced, color: "text-emerald-600 dark:text-emerald-400" }
  return { label: t.assessment.levels.expert, color: "text-violet-600 dark:text-violet-400" }
}

// 每页显示的维度数量
const DIMENSIONS_PER_PAGE = 5

export function DynamicSkillAssessment({ onComplete }: DynamicSkillAssessmentProps) {
  const router = useRouter()
  const t = useT()
  const [subjectInput, setSubjectInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentSubject, setCurrentSubject] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<SubjectDimension[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)

  // 快捷科目标签配置
  const quickSubjects = [
    { key: "gradMath", label: t.assessment.subjects.gradMath },
    { key: "gradEnglish", label: t.assessment.subjects.gradEnglish },
    { key: "gradPolitics", label: t.assessment.subjects.gradPolitics },
    { key: "cet4", label: t.assessment.subjects.cet4 },
    { key: "cet6", label: t.assessment.subjects.cet6 },
    { key: "ncre2", label: t.assessment.subjects.ncre2 },
  ]

  // 计算总页数
  const totalPages = Math.ceil(dimensions.length / DIMENSIONS_PER_PAGE)

  // 获取当前页的维度
  const getCurrentPageDimensions = () => {
    const startIndex = (currentPage - 1) * DIMENSIONS_PER_PAGE
    const endIndex = startIndex + DIMENSIONS_PER_PAGE
    return dimensions.slice(startIndex, endIndex)
  }

  // 检查当前页是否全部评估完成
  const isCurrentPageComplete = () => {
    const currentDimensions = getCurrentPageDimensions()
    return currentDimensions.every((dim) => ratings[dim.id] !== undefined)
  }

  // 检查所有维度是否评估完成
  const isAllComplete = () => {
    return dimensions.length > 0 && dimensions.every((dim) => ratings[dim.id] !== undefined)
  }

  // 处理科目提交
  const handleSubjectSubmit = useCallback(async () => {
    if (!subjectInput.trim()) return

    setIsAnalyzing(true)

    // 模拟1.5秒分析时间
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 获取匹配的评测维度
    const matchedDimensions = getSubjectDimensions(subjectInput)

    setCurrentSubject(subjectInput)
    setDimensions(matchedDimensions)
    setRatings({}) // 重置评分
    setCurrentPage(1) // 重置到第一页
    setIsAnalyzing(false)
  }, [subjectInput])

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubjectSubmit()
    }
  }

  // 处理维度评分
  const handleRating = (dimensionId: string, score: number) => {
    const newRatings = { ...ratings, [dimensionId]: score }
    setRatings(newRatings)

    // 如果所有维度都已评分，触发完成回调
    if (Object.keys(newRatings).length === dimensions.length && onComplete && currentSubject) {
      onComplete(currentSubject, newRatings)
    }
  }

  // 快捷按钮跳转
  const handleUploadClick = () => router.push("/exam?step=source&source=upload")
  const handleSearchClick = () => router.push("/exam?step=goal&source=search")

  // 切换/重新评测科目
  const handleChangeSubject = () => {
    setCurrentSubject(null)
    setDimensions([])
    setRatings({})
    setSubjectInput("")
    setCurrentPage(1)
  }

  // 下一页
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // 上一页
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // 生成考题 - 跳转到能力分析页面
  const handleGenerateExam = () => {
    if (!currentSubject || dimensions.length === 0) return

    // 保存评估数据到 localStorage
    const assessmentResult = analyzeAssessmentResult(currentSubject, dimensions, ratings)
    localStorage.setItem('targetedAssessmentData', JSON.stringify(assessmentResult))

    // 直接跳转，不触发回调避免页面闪烁
    router.push('/assessment/targeted-quiz')
  }

  const currentPageDimensions = getCurrentPageDimensions()

  return (
    <div className="space-y-6">
      {/* 输入区域 - 极简白色卡片 */}
      <Card className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">{t.assessment.title}</h2>
          {currentSubject && (
            <button
              onClick={handleChangeSubject}
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {t.assessment.switchSubject}
            </button>
          )}
        </div>
        <p className="text-neutral-600 dark:text-neutral-300 text-base mb-5">{t.assessment.subtitle}</p>

        {/* 科目输入框 */}
        <div className="relative">
          <Input
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.assessment.inputPlaceholder}
            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 pr-14 h-14 text-xl font-medium rounded-xl"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleSubjectSubmit}
            disabled={isAnalyzing || !subjectInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg
                       bg-indigo-600 hover:bg-indigo-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* 快捷科目标签 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickSubjects.map((subject) => (
            <button
              key={subject.key}
              onClick={() => setSubjectInput(subject.label)}
              className="px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                       border border-neutral-200 dark:border-neutral-700 rounded-full transition-all duration-200 cursor-pointer"
            >
              {subject.label}
            </button>
          ))}
        </div>

        {/* 快捷按钮 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Badge
            onClick={handleUploadClick}
            className="cursor-pointer bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700
                       hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors px-4 py-3 text-base font-medium rounded-full
                       flex items-center justify-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t.assessment.uploadQuestions}
          </Badge>
          <Badge
            onClick={handleSearchClick}
            className="cursor-pointer bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700
                       hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors px-4 py-3 text-base font-medium rounded-full
                       flex items-center justify-center"
          >
            <Search className="w-4 h-4 mr-2" />
            {t.assessment.searchQuestions}
          </Badge>
        </div>
      </Card>

      {/* 等待设定目标占位符 */}
      {!currentSubject && !isAnalyzing && (
        <Card className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800
                          flex items-center justify-center mb-6 border border-neutral-200 dark:border-neutral-700">
              <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-2">{t.assessment.waitingTitle}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
              {t.assessment.waitingDesc}
            </p>
          </div>
        </Card>
      )}

      {/* 骨架屏加载效果 */}
      {isAnalyzing && (
        <Card className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800" />
              <Skeleton className="h-5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <Skeleton className="h-4 w-64 bg-neutral-100 dark:bg-neutral-800/70" />
            <div className="space-y-6 mt-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800" />
                      <Skeleton className="h-3 w-48 bg-neutral-100 dark:bg-neutral-800/50" />
                    </div>
                    <Skeleton className="h-6 w-8 bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                  <div className="flex gap-2">
                    {[...Array(10)].map((_, j) => (
                      <Skeleton key={j} className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 动态评测维度 */}
      {currentSubject && !isAnalyzing && dimensions.length > 0 && (
        <Card className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{currentSubject} · {t.assessment.skillDiagnosis}</h3>
                <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {Object.keys(ratings).length}/{dimensions.length}
                </Badge>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {t.assessment.rateSkills} · {t.assessment.pageOf.replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {currentPageDimensions.map((dimension) => {
              const currentRating = ratings[dimension.id]
              const levelInfo = currentRating ? getLevelLabel(currentRating, t) : null

              return (
                <div key={dimension.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-950 dark:text-white font-medium">{dimension.name}</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{dimension.description}</p>
                      {levelInfo && (
                        <p className={`text-xs mt-1 ${levelInfo.color}`}>
                          <Zap className="w-3 h-3 inline mr-1" />
                          {levelInfo.label}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 min-w-[3rem] text-right tabular-nums">
                      {currentRating || "-"}
                    </span>
                  </div>

                  {/* 1-10分按钮组 */}
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleRating(dimension.id, score)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                          currentRating === score
                            ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200"
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 分页指示器 */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  page === currentPage
                    ? "bg-indigo-600 w-6"
                    : "bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                }`}
              />
            ))}
          </div>
        </Card>
      )}

      {/* 操作按钮卡片 */}
      {currentSubject && !isAnalyzing && dimensions.length > 0 && (
        <Card className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          {currentPage < totalPages ? (
            // 第一页：显示"下一步"按钮
            <div className="flex gap-3">
              {currentPage > 1 && (
                <button
                  onClick={handlePrevPage}
                  className="flex-1 py-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                           text-neutral-700 dark:text-neutral-300 font-medium transition-all duration-200
                           flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>{t.assessment.prevStep}</span>
                </button>
              )}
              <button
                onClick={handleNextPage}
                disabled={!isCurrentPageComplete()}
                className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200
                           flex items-center justify-center gap-2
                           ${isCurrentPageComplete()
                             ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                             : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                           }`}
              >
                <span className="text-lg">{t.assessment.nextStep}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // 最后一页：显示操作按钮
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handlePrevPage}
                  className="flex-shrink-0 px-6 py-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700
                           text-neutral-700 dark:text-neutral-300 font-medium transition-all duration-200
                           flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>{t.assessment.prevStep}</span>
                </button>
                <button
                  onClick={handleGenerateExam}
                  disabled={!isAllComplete()}
                  className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200
                             flex items-center justify-center gap-2
                             ${isAllComplete()
                               ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                               : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                             }`}
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-lg">{t.assessment.generateQuestions}</span>
                </button>
              </div>
            </div>
          )}
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-3">
            {currentPage < totalPages
              ? `请完成当前页所有评估后进入下一步 (${Object.keys(ratings).filter(id => getCurrentPageDimensions().some(d => d.id === id)).length}/${currentPageDimensions.length})`
              : isAllComplete()
                ? "AI 将根据评分侧重训练薄弱环节"
                : `请完成所有评估 (${Object.keys(ratings).length}/${dimensions.length})`
            }
          </p>
        </Card>
      )}
    </div>
  )
}
