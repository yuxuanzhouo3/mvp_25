"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, ArrowLeft, Upload, Search, Loader2, Zap, Brain, ChevronRight } from "lucide-react"
import { getSubjectDimensions, type SubjectDimension } from "@/lib/subject-dimensions"

interface DynamicSkillAssessmentProps {
  onComplete?: (subject: string, ratings: Record<string, number>) => void
  onGenerateExam?: (subject: string, ratings: Record<string, number>) => void
}

// 获取等级标签
function getLevelLabel(score: number): { label: string; color: string } {
  if (score <= 3) return { label: "入门阶段 - 需要系统学习", color: "text-orange-400" }
  if (score <= 6) return { label: "进阶阶段 - 能够独立完成基本任务", color: "text-blue-400" }
  if (score <= 8) return { label: "熟练阶段 - 可以处理复杂问题", color: "text-green-400" }
  return { label: "精通阶段 - 专家级别", color: "text-purple-400" }
}

// 每页显示的维度数量
const DIMENSIONS_PER_PAGE = 5

export function DynamicSkillAssessment({ onComplete, onGenerateExam }: DynamicSkillAssessmentProps) {
  const router = useRouter()
  const [subjectInput, setSubjectInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentSubject, setCurrentSubject] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<SubjectDimension[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)

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
  const handleUploadClick = () => router.push("/exam?step=source")
  const handleSearchClick = () => router.push("/exam")

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

  // 生成考题
  const handleGenerateExam = () => {
    if (onGenerateExam && currentSubject) {
      onGenerateExam(currentSubject, ratings)
    } else {
      handleSearchClick()
    }
  }

  const currentPageDimensions = getCurrentPageDimensions()

  return (
    <div className="space-y-6">
      {/* 输入区域 - 紫色渐变卡片 */}
      <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">今天你想攻克什么考试？</h2>
          {currentSubject && (
            <button
              onClick={handleChangeSubject}
              className="text-sm text-purple-200 hover:text-white transition-colors"
            >
              切换科目
            </button>
          )}
        </div>
        <p className="text-purple-200 text-sm mb-5">AI 将根据你的目标，自动构建能力评估模型。</p>

        {/* 科目输入框 */}
        <div className="relative">
          <Input
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入目标，如：考研数学"
            className="bg-white/95 border-0 text-slate-800 placeholder:text-slate-400 pr-14 h-14 text-base rounded-2xl shadow-sm"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleSubjectSubmit}
            disabled={isAnalyzing || !subjectInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl
                       bg-gradient-to-r from-purple-500 to-blue-500
                       hover:from-purple-600 hover:to-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-md"
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
          {["考研数学", "考研英语", "考研政治", "大学英语四级", "大学英语六级", "计算机二级"].map((subject) => (
            <button
              key={subject}
              onClick={() => setSubjectInput(subject)}
              className="px-4 py-1.5 text-sm text-white/90 bg-white/10 hover:bg-white/20
                       border border-white/20 rounded-full transition-all duration-200"
            >
              {subject}
            </button>
          ))}
        </div>

        {/* 快捷按钮 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Badge
            onClick={handleUploadClick}
            className="cursor-pointer bg-white/20 text-white border-white/30
                       hover:bg-white/30 transition-colors px-4 py-2.5 text-sm rounded-full
                       flex items-center justify-center"
          >
            <Upload className="w-3.5 h-3.5 mr-2" />
            上传题目
          </Badge>
          <Badge
            onClick={handleSearchClick}
            className="cursor-pointer bg-white/20 text-white border-white/30
                       hover:bg-white/30 transition-colors px-4 py-2.5 text-sm rounded-full
                       flex items-center justify-center"
          >
            <Search className="w-3.5 h-3.5 mr-2" />
            搜题直达
          </Badge>
        </div>
      </Card>

      {/* 等待设定目标占位符 */}
      {!currentSubject && !isAnalyzing && (
        <Card className="bg-slate-800/50 border-slate-700 p-8 animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20
                          flex items-center justify-center mb-6 border border-slate-600/50">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">等待设定目标</h3>
            <p className="text-sm text-slate-400 text-center max-w-xs">
              在上方输入科目后，AI 将为你定制专属的知识点评分维度。
            </p>
          </div>
        </Card>
      )}

      {/* 骨架屏加载效果 */}
      {isAnalyzing && (
        <Card className="bg-slate-800/50 border-slate-700 p-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48 bg-slate-700" />
              <Skeleton className="h-5 w-16 rounded-full bg-slate-700" />
            </div>
            <Skeleton className="h-4 w-64 bg-slate-700/70" />
            <div className="space-y-6 mt-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-32 bg-slate-700" />
                      <Skeleton className="h-3 w-48 bg-slate-700/50" />
                    </div>
                    <Skeleton className="h-6 w-8 bg-slate-700" />
                  </div>
                  <div className="flex gap-2">
                    {[...Array(10)].map((_, j) => (
                      <Skeleton key={j} className="w-8 h-8 rounded-full bg-slate-700" />
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
        <Card className="bg-slate-800/50 border-slate-700 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{currentSubject} · 技能诊断</h3>
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {Object.keys(ratings).length}/{dimensions.length}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                请评估你在以下技能的熟练程度 (1-10分) · 第 {currentPage}/{totalPages} 页
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {currentPageDimensions.map((dimension) => {
              const currentRating = ratings[dimension.id]
              const levelInfo = currentRating ? getLevelLabel(currentRating) : null

              return (
                <div key={dimension.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{dimension.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{dimension.description}</p>
                      {levelInfo && (
                        <p className={`text-xs mt-1 ${levelInfo.color}`}>
                          <Zap className="w-3 h-3 inline mr-1" />
                          {levelInfo.label}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-blue-400 min-w-[3rem] text-right tabular-nums">
                      {currentRating || "-"}
                    </span>
                  </div>

                  {/* 1-10分按钮组 */}
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleRating(dimension.id, score)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                          currentRating === score
                            ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
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
                className={`w-2 h-2 rounded-full transition-all ${
                  page === currentPage
                    ? "bg-blue-500 w-6"
                    : "bg-slate-600 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>
        </Card>
      )}

      {/* 操作按钮卡片 */}
      {currentSubject && !isAnalyzing && dimensions.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          {currentPage < totalPages ? (
            // 第一页：显示"下一步"按钮
            <div className="flex gap-3">
              {currentPage > 1 && (
                <button
                  onClick={handlePrevPage}
                  className="flex-1 py-4 rounded-xl bg-slate-700 hover:bg-slate-600
                           text-white font-medium transition-all duration-200
                           flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>上一步</span>
                </button>
              )}
              <button
                onClick={handleNextPage}
                disabled={!isCurrentPageComplete()}
                className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200
                           flex items-center justify-center gap-2
                           ${isCurrentPageComplete()
                             ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-600/20"
                             : "bg-slate-700 text-slate-500 cursor-not-allowed"
                           }`}
              >
                <span className="text-lg">下一步</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // 最后一页：显示"生成专属题目"按钮
            <div className="flex gap-3">
              <button
                onClick={handlePrevPage}
                className="flex-shrink-0 px-6 py-4 rounded-xl bg-slate-700 hover:bg-slate-600
                         text-white font-medium transition-all duration-200
                         flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>上一步</span>
              </button>
              <button
                onClick={handleGenerateExam}
                disabled={!isAllComplete()}
                className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200
                           flex items-center justify-center gap-2
                           ${isAllComplete()
                             ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30"
                             : "bg-slate-700 text-slate-500 cursor-not-allowed"
                           }`}
              >
                <Zap className="w-5 h-5" />
                <span className="text-lg">生成我的专属考题</span>
              </button>
            </div>
          )}
          <p className="text-center text-xs text-slate-500 mt-3">
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
