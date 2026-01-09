"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Search,
  FileText,
  Globe,
  Loader2,
  CheckCircle,
  Sparkles,
  Target,
  BookOpen,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { EXAM_PRESETS } from "@/lib/exam-mock-data"
import { parseFile, validateFile, MAX_FILE_SIZE } from "@/lib/file-parser"

type Step = 'goal' | 'source' | 'config' | 'processing' | 'ready'
type SourceType = 'upload' | 'search' | null

// 联网搜索结果类型
interface SyllabusData {
  examInfo?: {
    name: string
    officialWebsite?: string
    examTime?: string
    totalScore?: string
    duration?: string
  }
  syllabus?: Array<{
    chapter: string
    weight: string
    keyPoints: string[]
    questionTypes?: string[]
  }>
  questionDistribution?: Record<string, string>
  preparationTips?: string[]
  recentChanges?: string
  searchSources?: string[]
  rawContent?: string
}

// 内部组件，处理搜索参数
function ExamSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 从 URL 参数获取初始 step
  const getInitialStep = (): Step => {
    const stepParam = searchParams.get('step')
    if (stepParam && ['goal', 'source', 'config', 'processing', 'ready'].includes(stepParam)) {
      return stepParam as Step
    }
    return 'goal'
  }

  const [step, setStep] = useState<Step>(getInitialStep())
  const [examName, setExamName] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // 出题数量和文件错误状态
  const [questionCount, setQuestionCount] = useState(10)
  const [fileError, setFileError] = useState<string | null>(null)

  // 联网搜索状态
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [syllabusData, setSyllabusData] = useState<SyllabusData | null>(null)
  const [processingSteps, setProcessingSteps] = useState<string[]>([])

  // 拖拽上传状态
  const [isDragOver, setIsDragOver] = useState(false)

  // 获取考试类型
  const getExamType = (name: string): string => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('考研') || lowerName.includes('研究生')) return 'postgraduate'
    if (lowerName.includes('四级') || lowerName.includes('cet4') || lowerName.includes('cet-4')) return 'cet4'
    if (lowerName.includes('六级') || lowerName.includes('cet6') || lowerName.includes('cet-6')) return 'cet6'
    if (lowerName.includes('公务员') || lowerName.includes('国考') || lowerName.includes('省考')) return 'civilService'
    return 'default'
  }

  // 处理下一步
  const handleNext = () => {
    if (step === 'goal' && examName) {
      setStep('source')
    } else if (step === 'source' && sourceType) {
      setStep('processing')
      if (sourceType === 'search') {
        // 真实联网搜索
        performWebSearch()
      } else {
        // 真实文件处理
        processUploadedFile()
      }
    }
  }

  // 真实联网搜索
  const performWebSearch = async () => {
    setIsSearching(true)
    setSearchError(null)
    setProcessingProgress(0)
    setProcessingSteps([])

    // 清除之前上传文件生成的题目缓存，确保使用 AI 联网出题
    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('generatedExamName')

    const examType = getExamType(examName)

    try {
      // 步骤1: 开始搜索
      setProcessingSteps(['正在联网搜索考试大纲...'])
      setProcessingProgress(10)

      const searchResponse = await fetch('/api/exam/search-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          examName
        })
      })

      // 步骤2: 解析搜索结果
      setProcessingSteps(prev => [...prev, '正在解析搜索结果...'])
      setProcessingProgress(25)

      let syllabusInfo = null
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        syllabusInfo = searchData.data
        setSyllabusData(syllabusInfo)
        localStorage.setItem('examSyllabus', JSON.stringify(syllabusInfo))
      }

      // 步骤3: 调用 AI 生成题目（核心步骤）
      setProcessingSteps(prev => [...prev, '正在 AI 生成题目...'])
      setProcessingProgress(40)

      const generateResponse = await fetch('/api/exam/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          examName,
          syllabus: syllabusInfo?.syllabus || null,
          count: questionCount
        })
      })

      setProcessingProgress(70)

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json()
        throw new Error(errorData.error || 'AI 生成题目失败')
      }

      const generateData = await generateResponse.json()

      if (!generateData.questions || generateData.questions.length === 0) {
        throw new Error('AI 返回的题目为空')
      }

      // 步骤4: 格式化并保存题目
      setProcessingSteps(prev => [...prev, '正在优化题目质量...'])
      setProcessingProgress(85)

      // 转换题目格式
      const formattedQuestions = generateData.questions.map((q: {
        id: string
        type?: string
        question?: string
        content?: string
        options?: string[]
        correctAnswer: number | number[] | string[]
        explanation: string
        difficulty: number
        knowledgePoint: string
        category?: string
        blanksCount?: number
      }) => ({
        id: q.id,
        type: (q.type as 'single' | 'multiple' | 'fill') || 'single',
        content: q.content || q.question || '题目加载失败',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: Math.min(5, Math.max(1, q.difficulty)) as 1 | 2 | 3 | 4 | 5,
        knowledgePoint: q.knowledgePoint,
        category: q.category,
        blanksCount: q.blanksCount
      }))

      // 保存生成的题目到 localStorage
      localStorage.setItem('generatedQuestions', JSON.stringify(formattedQuestions))
      localStorage.setItem('generatedExamName', examName)

      // 步骤5: 完成
      setProcessingSteps(prev => [...prev, `题库生成完成！共 ${formattedQuestions.length} 题`])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 300))
      setStep('ready')

    } catch (error) {
      console.error('联网搜索出题失败:', error)
      setSearchError(error instanceof Error ? error.message : '联网搜索出题失败，请稍后重试')

      // 搜索失败，返回上一步让用户重试
      setProcessingSteps(prev => [...prev, '⚠️ 出题失败，请重试'])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 1500))
      setStep('source')

    } finally {
      setIsSearching(false)
    }
  }

  // 真实文件处理（替换 simulateProcessing）
  const processUploadedFile = async () => {
    if (!uploadedFile) return

    setProcessingProgress(0)
    setProcessingSteps([])
    setSearchError(null)

    // 清除之前的题目缓存，确保使用新上传文件生成的题目
    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('generatedExamName')
    localStorage.removeItem('examSyllabus')

    try {
      // 步骤1: 解析文件
      setProcessingSteps(['正在解析文档内容...'])
      setProcessingProgress(20)

      const parseResult = await parseFile(uploadedFile)

      if (!parseResult.success) {
        throw new Error(parseResult.error || '文件解析失败')
      }

      // 步骤2: 提取知识点
      setProcessingSteps(prev => [...prev, '正在提取核心知识点...'])
      setProcessingProgress(40)

      await new Promise(resolve => setTimeout(resolve, 500))

      // 步骤3: 调用 AI 生成题目
      setProcessingSteps(prev => [...prev, '正在生成题库...'])
      setProcessingProgress(60)

      const response = await fetch('/api/exam/generate-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: parseResult.text,
          examName: examName,
          count: questionCount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API 错误响应:', errorData)

        // 检查是否是 API Key 问题
        if (response.status === 401 || response.status === 403) {
          throw new Error('API Key 未配置或无效，请检查 .env.local 文件')
        }

        throw new Error(errorData.error || 'AI 生成题目失败')
      }

      const data = await response.json()
      console.log('API 返回数据:', data)

      if (!data.success || !data.questions || data.questions.length === 0) {
        console.error('题目数据无效:', data)
        throw new Error(data.error || 'AI 返回的题目为空，请检查 API 配置')
      }

      // 步骤4: 保存题目
      setProcessingSteps(prev => [...prev, '正在优化题目质量...'])
      setProcessingProgress(80)

      // 保存生成的题目到 localStorage
      console.log('保存题目到 localStorage:', data.questions.length, '题')
      localStorage.setItem('generatedQuestions', JSON.stringify(data.questions))
      localStorage.setItem('generatedExamName', examName)

      await new Promise(resolve => setTimeout(resolve, 500))

      // 步骤5: 完成
      setProcessingSteps(prev => [...prev, '题库生成完成！'])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 300))
      setStep('ready')

    } catch (error) {
      console.error('文件处理失败:', error)
      const errorMessage = error instanceof Error ? error.message : '文件处理失败，请稍后重试'
      setSearchError(errorMessage)

      // 文件解析失败，返回上一步让用户重新上传
      setProcessingSteps(prev => [...prev, '⚠️ 处理失败，请重新上传文件'])
      setProcessingProgress(100)

      await new Promise(resolve => setTimeout(resolve, 1500))

      // 重置状态并返回 source 步骤
      setUploadedFile(null)
      setSourceType('upload')
      setFileError(errorMessage)
      setStep('source')
    }
  }

  // 模拟处理过程（文档上传）- 已废弃，保留以防万一
  const simulateProcessing = () => {
    setProcessingProgress(0)
    setProcessingSteps([])

    const steps = [
      '正在解析文档内容...',
      '正在提取核心知识点...',
      '正在生成分级题库...',
      '正在优化题目质量...',
      '题库生成完成！'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(interval)
          setStep('ready')
          return 100
        }

        // 更新步骤
        const stepIndex = Math.floor((newProgress / 100) * steps.length)
        if (stepIndex > currentStep && stepIndex < steps.length) {
          currentStep = stepIndex
          setProcessingSteps(steps.slice(0, stepIndex + 1))
        }

        return newProgress
      })
    }, 300)
  }

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
      // 清空 input
      e.target.value = ''
    }
  }

  // 处理文件验证和设置（抽取公共逻辑）
  const processFile = (file: File) => {
    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      setFileError(validation.error || '文件验证失败')
      setUploadedFile(null)
      setSourceType(null)
      return
    }

    setFileError(null)
    setUploadedFile(file)
    setSourceType('upload')
  }

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 只有当离开整个拖拽区域时才设置为 false
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      processFile(file)
    }
  }

  // 开始刷题
  const handleStartPractice = () => {
    // 保存考试信息到 localStorage
    localStorage.setItem('currentExam', JSON.stringify({
      examName,
      sourceType,
      questionCount,
      hasSyllabus: !!syllabusData
    }))

    // 重置答题进度（新题库从第一题开始）
    localStorage.setItem('examCurrentIndex', '0')

    router.push('/exam/practice')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </button>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              智能备考系统
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          {['goal', 'source', 'processing', 'ready'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s
                    ? 'bg-blue-600 text-white scale-110'
                    : ['goal', 'source', 'processing', 'ready'].indexOf(step) > i
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {['goal', 'source', 'processing', 'ready'].indexOf(step) > i ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-16 h-1 mx-2 rounded ${
                    ['goal', 'source', 'processing', 'ready'].indexOf(step) > i
                      ? 'bg-green-600'
                      : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {/* Step 1: 设置考试目标 */}
          {step === 'goal' && (
            <Card className="bg-slate-800/50 border-slate-700 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">设置你的考试目标</h2>
                <p className="text-slate-400">告诉 AI 你要准备什么考试，我们会为你量身定制学习计划</p>
              </div>

              <div className="space-y-6">
                {/* 考试名称 */}
                <div>
                  <Label className="text-slate-300 mb-2 block">考试名称</Label>
                  <Input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="例如：考研数学、大学英语四级..."
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />

                  {/* 快速选择 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {EXAM_PRESETS.slice(0, 6).map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setExamName(preset.name)}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                          examName === preset.name
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <Button
                  onClick={handleNext}
                  disabled={!examName}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  下一步
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  onClick={() => {
                    setExamName('自定义题库')
                    setSourceType('upload')
                    setStep('source')
                  }}
                  variant="outline"
                  className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  跳过，直接上传题库
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: 选择资料来源 */}
          {step === 'source' && (
            <Card className="bg-slate-800/50 border-slate-700 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">你有备考资料吗？</h2>
                <p className="text-slate-400">选择资料来源，AI 将基于此生成精准题库</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 上传资料 */}
                <div
                  onClick={() => setSourceType('upload')}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    sourceType === 'upload'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      sourceType === 'upload' ? 'bg-blue-600' : 'bg-slate-600'
                    }`}>
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">上传我的资料</h3>
                    <p className="text-sm text-slate-400">上传 PDF/Word 文档，AI 解析生成题库</p>
                  </div>
                  {sourceType === 'upload' && (
                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-blue-400" />
                  )}
                </div>

                {/* AI 联网搜索 */}
                <div
                  onClick={() => setSourceType('search')}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    sourceType === 'search'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      sourceType === 'search' ? 'bg-purple-600' : 'bg-slate-600'
                    }`}>
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">AI 联网搜索</h3>
                    <p className="text-sm text-slate-400">AI 自动搜索考试大纲，生成题库</p>
                  </div>
                  {sourceType === 'search' && (
                    <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-purple-400" />
                  )}
                </div>
              </div>

              {/* 上传区域 */}
              {sourceType === 'upload' && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 animate-in fade-in duration-300 transition-all ${
                    isDragOver
                      ? 'border-green-400 bg-green-500/20 scale-[1.02]'
                      : !uploadedFile
                        ? 'border-blue-500 bg-blue-500/10 animate-pulse'
                        : 'border-slate-600'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {isDragOver ? (
                      <>
                        <Upload className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-300 font-medium">松开鼠标上传文件</p>
                        <p className="text-sm text-green-400/70">支持 PDF、Word 格式</p>
                      </>
                    ) : uploadedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <div className="text-left">
                          <p className="text-white font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-slate-400">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-bounce" />
                        <p className="text-blue-300 font-medium">点击或拖拽上传文件</p>
                        <p className="text-sm text-blue-400/70">支持 PDF、Word 格式（最大 10MB）</p>
                        <p className="text-xs text-slate-500 mt-2">可从文件夹、QQ、微信直接拖入</p>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* AI 搜索提示 */}
              {sourceType === 'search' && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-purple-300 font-medium">AI 将为你搜索以下内容：</p>
                      <ul className="text-sm text-slate-400 mt-2 space-y-1">
                        <li>• {examName} 官方考试大纲</li>
                        <li>• 历年真题及解析</li>
                        <li>• 高频考点汇总</li>
                        <li>• 备考技巧与建议</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 文件错误提示 */}
              {fileError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{fileError}</span>
                  </div>
                </div>
              )}

              {/* 出题数量选择器 */}
              {sourceType && (
                <div className="mb-6 animate-in fade-in duration-300">
                  <Label className="text-slate-300 mb-3 block">出题数量</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(num => (
                      <button
                        key={num}
                        onClick={() => setQuestionCount(num)}
                        className={`py-3 rounded-lg font-medium transition-all ${
                          questionCount === num
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {num} 题
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">最多支持 20 题</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('goal')}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  上一步
                </Button>
                <div className="flex-1">
                  <Button
                    onClick={handleNext}
                    disabled={!sourceType || (sourceType === 'upload' && !uploadedFile)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开始生成题库
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                  {sourceType === 'upload' && !uploadedFile && (
                    <p className="text-xs text-yellow-400 mt-1 text-center">
                      ⚠️ 请先上传文件
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: 处理中 */}
          {step === 'processing' && (
            <Card className="bg-slate-800/50 border-slate-700 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  {sourceType === 'search' ? (
                    <Globe className="w-10 h-10 text-white animate-pulse" />
                  ) : (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {sourceType === 'upload' ? '正在解析你的文档...' : '🌐 正在联网搜索考试资料...'}
                </h2>
                <p className="text-slate-400 mb-8">
                  {sourceType === 'search'
                    ? 'AI 正在联网获取最新考试大纲和题型信息'
                    : 'AI 正在努力为你准备精准题库，请稍候'}
                </p>

                <div className="max-w-md mx-auto">
                  <Progress value={processingProgress} className="h-2 mb-2" />
                  <p className="text-sm text-slate-500">{Math.min(100, Math.floor(processingProgress))}%</p>
                </div>

                {/* 显示实时处理步骤 */}
                <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
                  {processingSteps.length > 0 ? (
                    // 显示真实的处理步骤
                    processingSteps.map((stepText, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {stepText.includes('⚠️') ? (
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                        ) : i === processingSteps.length - 1 && processingProgress < 100 ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        <span className={stepText.includes('⚠️') ? 'text-yellow-400' : 'text-green-400'}>
                          {stepText}
                        </span>
                      </div>
                    ))
                  ) : (
                    // 默认步骤（兼容旧逻辑）
                    [
                      { text: '分析考试大纲', done: processingProgress > 20 },
                      { text: '提取核心知识点', done: processingProgress > 40 },
                      { text: '生成分级题库', done: processingProgress > 60 },
                      { text: '优化题目质量', done: processingProgress > 80 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.done ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : processingProgress > i * 20 ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                        )}
                        <span className={item.done ? 'text-green-400' : 'text-slate-400'}>
                          {item.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* 搜索错误提示 */}
                {searchError && (
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">搜索遇到问题</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{searchError}</p>
                    <p className="text-sm text-slate-500 mt-1">将使用默认题库继续</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 4: 准备完成 */}
          {step === 'ready' && (
            <Card className="bg-slate-800/50 border-slate-700 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">题库生成完成！</h2>
                <p className="text-slate-400 mb-6">已为你准备好 {examName} 的专属题库</p>

                {/* 搜索结果摘要（如果有联网搜索数据） */}
                {syllabusData && syllabusData.examInfo && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-purple-400" />
                      <span className="text-purple-400 font-medium">联网搜索结果</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {syllabusData.examInfo.name && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">考试名称：</span>
                          {syllabusData.examInfo.name}
                        </p>
                      )}
                      {syllabusData.examInfo.examTime && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">考试时间：</span>
                          {syllabusData.examInfo.examTime}
                        </p>
                      )}
                      {syllabusData.examInfo.totalScore && (
                        <p className="text-slate-300">
                          <span className="text-slate-500">总分：</span>
                          {syllabusData.examInfo.totalScore}
                        </p>
                      )}
                      {syllabusData.examInfo.officialWebsite && (
                        <a
                          href={syllabusData.examInfo.officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          官方网站 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 知识点摘要（如果有联网搜索数据） */}
                {syllabusData && syllabusData.syllabus && syllabusData.syllabus.length > 0 && (
                  <div className="bg-slate-700/30 rounded-xl p-4 mb-6 text-left">
                    <p className="text-slate-400 text-sm mb-3">📚 已获取的考纲章节：</p>
                    <div className="flex flex-wrap gap-2">
                      {syllabusData.syllabus.slice(0, 5).map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
                          {item.chapter}
                        </span>
                      ))}
                      {syllabusData.syllabus.length > 5 && (
                        <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-400">
                          +{syllabusData.syllabus.length - 5} 更多
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-400">
                      {syllabusData?.syllabus ? syllabusData.syllabus.length * 4 : 20}+
                    </div>
                    <div className="text-sm text-slate-400">精选题目</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-purple-400">
                      {syllabusData?.syllabus?.length || 5}
                    </div>
                    <div className="text-sm text-slate-400">知识模块</div>
                  </div>
                </div>

                {/* 等级提示 */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">🥉</span>
                    <span className="text-amber-400 font-bold">青铜</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    你将从青铜等级开始，答题获得积分升级！<br />
                    连续答对有连击加成，但小心连续答错会降级哦~
                  </p>
                </div>

                <Button
                  onClick={handleStartPractice}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
                >
                  开始刷题闯关
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// 主导出组件，包装 Suspense
export default function ExamSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    }>
      <ExamSetupContent />
    </Suspense>
  )
}
