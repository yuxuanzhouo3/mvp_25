"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { ArrowLeft, BookMarked, Pause, Play, AlertTriangle, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { RankPanel } from "./RankPanel"
import { QuestionCard } from "./QuestionCard"
import { AnswerFeedback } from "./AnswerFeedback"
import { FollowUpChat } from "./FollowUpChat"
import { DemotionWarning } from "./DemotionWarning"
import { PracticeComplete } from "./PracticeComplete"
import {
  MOCK_QUESTIONS,
  INITIAL_RANK_STATE,
  calculatePoints,
  getRankByPoints,
  getDemotionWarningLevel,
  detectCheat,
  getPrevRank,
  RANK_ORDER,
  type Question,
  type UserRankState,
  type AnswerRecord,
  type WrongQuestion,
  type RankType
} from "@/lib/exam-mock-data"

// 辅助函数：从 localStorage 安全读取数据
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e)
  }
  return defaultValue
}

// 辅助函数：安全保存到 localStorage
function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e)
  }
}

interface PracticeArenaProps {
  examName?: string
}

export function PracticeArena({ examName = "考研数学" }: PracticeArenaProps) {
  const router = useRouter()

  // 使用 ref 追踪是否已初始化
  const isInitialized = useRef(false)

  // 题目状态 - 动态加载
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [usingFallback, setUsingFallback] = useState(false)

  // 初始化时从 localStorage 读取 currentIndex
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    const saved = localStorage.getItem('examCurrentIndex')
    if (saved) {
      const index = parseInt(saved, 10)
      if (!isNaN(index) && index >= 0) {
        return index
      }
    }
    return 0
  })
  const [answeredCount, setAnsweredCount] = useState(0)

  // 用户等级状态 - 每次进入练习时重置本次统计
  const [rankState, setRankState] = useState<UserRankState>(() => {
    // 每次开始新的练习，重置本次统计数据
    return {
      ...INITIAL_RANK_STATE,
      points: 0,
      currentCombo: 0,
      maxCombo: 0,
      consecutiveWrong: 0,
      todayCorrect: 0,
      todayWrong: 0
    }
  })

  // 答题记录
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([])

  // 错题本 - 初始化为空，客户端加载后从 localStorage 读取
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([])

  // 客户端加载错题本数据
  useEffect(() => {
    const saved = loadFromStorage('examWrongQuestions', [])
    setWrongQuestions(saved)
  }, [])

  // UI 状态
  const [showFeedback, setShowFeedback] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningLevel, setWarningLevel] = useState<1 | 2 | 3>(1)
  const [warningConsecutiveWrong, setWarningConsecutiveWrong] = useState(0) // 用于警告弹窗显示的连续错误数
  const [cheatWarning, setCheatWarning] = useState<{detected: boolean; message: string}>({detected: false, message: ''})
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // 当前答题状态
  const [lastAnswer, setLastAnswer] = useState<{
    isCorrect: boolean
    userAnswer: number | number[] | string[]
    pointsChange: number
    partialScore?: number
  } | null>(null)

  // 前一个等级（用于降级显示）
  const [prevRank, setPrevRank] = useState<RankType | null>(null)

  // 当前题目
  const currentQuestion = questions[currentIndex]

  // 判断答案是否正确（支持单选/多选/填空）
  const checkAnswer = useCallback((
    userAnswer: number | number[] | string[],
    question: Question
  ): { isCorrect: boolean; partialScore?: number } => {
    const questionType = question.type || 'single'

    if (questionType === 'fill') {
      // 填空题：严格匹配，计算部分得分
      const userAnswers = userAnswer as string[]
      const correctAnswers = question.correctAnswer as string[]

      let correctCount = 0
      userAnswers.forEach((ans, i) => {
        if (ans === correctAnswers[i]) {
          correctCount++
        }
      })

      const partialScore = correctCount / correctAnswers.length
      return {
        isCorrect: partialScore === 1,
        partialScore
      }
    } else if (questionType === 'multiple') {
      // 多选题：数组完全匹配
      const userIndices = (userAnswer as number[]).sort()
      const correctIndices = (question.correctAnswer as number[]).sort()

      const isCorrect =
        userIndices.length === correctIndices.length &&
        userIndices.every((val, idx) => val === correctIndices[idx])

      return { isCorrect }
    } else {
      // 单选题：简单相等
      return {
        isCorrect: userAnswer === question.correctAnswer
      }
    }
  }, [])

  // 标记已初始化
  useEffect(() => {
    isInitialized.current = true
  }, [])

  // 动态加载题目
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoadingQuestions(true)
      setLoadingError(null)
      setLoadingProgress(10)

      try {
        // 1. 优先检查是否有上传文件生成的题目
        const cachedQuestions = localStorage.getItem('generatedQuestions')

        if (cachedQuestions) {
          try {
            const parsed = JSON.parse(cachedQuestions)
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('使用缓存的题目:', parsed.length, '题')

              // 检查 currentIndex 是否超出新题库范围，如果超出则重置为0
              const savedIndex = localStorage.getItem('examCurrentIndex')
              const savedIndexNum = savedIndex ? parseInt(savedIndex, 10) : 0
              if (savedIndexNum >= parsed.length) {
                console.log('currentIndex 超出范围，重置为 0')
                localStorage.setItem('examCurrentIndex', '0')
                setCurrentIndex(0)
              }

              setQuestions(parsed)
              setLoadingProgress(100)
              setIsLoadingQuestions(false)
              return
            }
          } catch (e) {
            console.error('解析缓存题目失败:', e)
            localStorage.removeItem('generatedQuestions')
          }
        }

        setLoadingProgress(20)

        // 2. 获取考试信息
        const examInfoStr = localStorage.getItem('currentExam')
        const examInfo = examInfoStr ? JSON.parse(examInfoStr) : null

        // 检查是否是上传文件模式但没有题目
        if (examInfo?.sourceType === 'upload') {
          throw new Error('未找到上传的题目，请返回重新上传文件')
        }

        // 3. 如果不是上传模式，则使用 AI 联网搜索生成题目
        const syllabusStr = localStorage.getItem('examSyllabus')
        const syllabusData = syllabusStr ? JSON.parse(syllabusStr) : null

        // 确定考试类型
        const getExamType = (name: string): string => {
          const lowerName = name.toLowerCase()
          if (lowerName.includes('考研') || lowerName.includes('研究生')) return 'postgraduate'
          if (lowerName.includes('四级') || lowerName.includes('cet4') || lowerName.includes('cet-4')) return 'cet4'
          if (lowerName.includes('六级') || lowerName.includes('cet6') || lowerName.includes('cet-6')) return 'cet6'
          if (lowerName.includes('公务员') || lowerName.includes('国考') || lowerName.includes('省考')) return 'civilService'
          return 'default'
        }

        const currentExamName = examInfo?.examName || examName
        const examType = getExamType(currentExamName)

        setLoadingProgress(40)
        console.log('正在调用 AI 生成题目...', { examType, currentExamName })

        // 4. 调用 AI 出题 API（仅用于联网搜索模式）
        const response = await fetch('/api/exam/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examType,
            examName: currentExamName,
            syllabus: syllabusData?.syllabus || null,
            count: 20
          })
        })

        setLoadingProgress(70)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'AI 出题失败')
        }

        const data = await response.json()

        if (!data.questions || data.questions.length === 0) {
          throw new Error('AI 返回的题目为空')
        }

        setLoadingProgress(90)

        // 转换题目格式以匹配 Question 类型
        const formattedQuestions: Question[] = data.questions.map((q: {
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

        // 缓存生成的题目
        localStorage.setItem('generatedQuestions', JSON.stringify(formattedQuestions))
        localStorage.setItem('generatedExamName', currentExamName)

        // 新生成的题库，重置进度为第一题
        localStorage.setItem('examCurrentIndex', '0')
        setCurrentIndex(0)

        setQuestions(formattedQuestions)
        setLoadingProgress(100)
        console.log('AI 题目加载成功:', formattedQuestions.length)

      } catch (error) {
        console.error('加载题目失败:', error)
        setLoadingError(error instanceof Error ? error.message : '加载题目失败')

        // 使用备用题库
        console.log('使用备用题库 MOCK_QUESTIONS')

        // 重置 currentIndex 以避免超出范围
        const savedIndex = localStorage.getItem('examCurrentIndex')
        const savedIndexNum = savedIndex ? parseInt(savedIndex, 10) : 0
        if (savedIndexNum >= MOCK_QUESTIONS.length) {
          localStorage.setItem('examCurrentIndex', '0')
          setCurrentIndex(0)
        }

        setQuestions(MOCK_QUESTIONS)
        setUsingFallback(true)
        setLoadingProgress(100)
      } finally {
        setIsLoadingQuestions(false)
      }
    }

    loadQuestions()
  }, [examName])

  // 保存 rankState 到 localStorage（仅在初始化后）
  useEffect(() => {
    if (isInitialized.current) {
      saveToStorage('examRankState', rankState)
    }
  }, [rankState])

  // 保存 wrongQuestions 到 localStorage（仅在初始化后）
  useEffect(() => {
    if (isInitialized.current) {
      saveToStorage('examWrongQuestions', wrongQuestions)
      console.log('Saved wrongQuestions to localStorage:', wrongQuestions.length, 'items')
    }
  }, [wrongQuestions])

  // 保存 currentIndex 到 localStorage（仅在初始化后）
  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem('examCurrentIndex', String(currentIndex))
      console.log('Saved currentIndex to localStorage:', currentIndex)
    }
  }, [currentIndex])

  // 处理答题
  const handleAnswer = useCallback((answer: number | number[] | string[], timeSpent: number) => {
    // 判断答案是否正确
    const { isCorrect, partialScore } = checkAnswer(answer, currentQuestion)

    // 创建答题记录
    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      userAnswer: answer,
      isCorrect,
      timeSpent,
      timestamp: Date.now(),
      partialScore
    }
    const newRecords = [...answerRecords, record]
    setAnswerRecords(newRecords)

    // 计算新的等级状态
    setRankState(prev => {
      const newConsecutiveWrong = isCorrect ? 0 : prev.consecutiveWrong + 1
      const newCombo = isCorrect ? prev.currentCombo + 1 : 0

      // 计算积分变化
      const pointsChange = calculatePoints(
        isCorrect,
        isCorrect ? newCombo : 0,
        currentQuestion.difficulty,
        newConsecutiveWrong,
        partialScore
      )

      const newPoints = Math.max(0, prev.points + pointsChange)
      const newRank = getRankByPoints(newPoints)

      // 检查是否降级
      const currentRankIndex = RANK_ORDER.indexOf(prev.rank)
      const newRankIndex = RANK_ORDER.indexOf(newRank)

      if (newRankIndex < currentRankIndex) {
        // 降级了
        setPrevRank(prev.rank)
        setWarningLevel(3)
        setWarningConsecutiveWrong(newConsecutiveWrong)
        setShowWarning(true)
      } else if (!isCorrect) {
        // 检查降级警告
        const warning = getDemotionWarningLevel(newConsecutiveWrong)
        if (warning > 0 && warning < 3) {
          setWarningLevel(warning as 1 | 2)
          setWarningConsecutiveWrong(newConsecutiveWrong)
          setShowWarning(true)
        }
      }

      // 保存答题结果
      setLastAnswer({
        isCorrect,
        userAnswer: answer,
        pointsChange,
        partialScore
      })

      return {
        ...prev,
        rank: newRank,
        points: newPoints,
        currentCombo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        consecutiveWrong: newConsecutiveWrong,
        todayCorrect: prev.todayCorrect + (isCorrect ? 1 : 0),
        todayWrong: prev.todayWrong + (isCorrect ? 0 : 1)
      }
    })

    setAnsweredCount(prev => prev + 1)

    // 检测乱答题行为
    const cheatResult = detectCheat(newRecords)
    if (cheatResult.detected) {
      setCheatWarning({ detected: true, message: cheatResult.message })
      setShowWarning(true)
    }

    // 显示反馈弹窗
    setShowFeedback(true)
  }, [currentQuestion, answerRecords, checkAnswer])

  // 添加到错题本
  const handleAddToWrongBook = useCallback(() => {
    if (!lastAnswer || lastAnswer.isCorrect) return

    setWrongQuestions(prev => {
      const existing = prev.find(w => w.questionId === currentQuestion.id)
      let newWrongQuestions: WrongQuestion[]

      if (existing) {
        newWrongQuestions = prev.map(w =>
          w.questionId === currentQuestion.id
            ? {
                ...w,
                wrongCount: w.wrongCount + 1,
                lastWrongAt: new Date(),
                userAnswers: [...w.userAnswers, lastAnswer.userAnswer]
              }
            : w
        )
      } else {
        newWrongQuestions = [...prev, {
          questionId: currentQuestion.id,
          question: currentQuestion,
          wrongCount: 1,
          lastWrongAt: new Date(),
          mastered: false,
          userAnswers: [lastAnswer.userAnswer]
        }]
      }

      // 立即同步保存到 localStorage，确保数据不会丢失
      saveToStorage('examWrongQuestions', newWrongQuestions)
      console.log('Added to wrong book, total:', newWrongQuestions.length)

      return newWrongQuestions
    })
  }, [currentQuestion, lastAnswer])

  // 下一题
  const handleNext = useCallback(() => {
    setShowFeedback(false)
    setLastAnswer(null)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 所有题目完成，显示结算卡片
      setIsCompleted(true)
    }
  }, [currentIndex, questions.length])

  // 重新开始
  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setAnsweredCount(0)
    setAnswerRecords([])
    setIsCompleted(false)
    // 重置今日统计但保留总积分
    setRankState(prev => ({
      ...prev,
      todayCorrect: 0,
      todayWrong: 0,
      currentCombo: 0,
      consecutiveWrong: 0
    }))
  }, [])

  // 进度百分比
  const progressPercent = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </button>

            <h1 className="text-xl font-bold text-neutral-950 dark:text-white">{examName}</h1>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/exam/review')}
                className="border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
              >
                <BookMarked className="w-4 h-4 mr-2" />
                错题本 ({wrongQuestions.length})
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* 加载状态 */}
        {isLoadingQuestions && (
          <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-neutral-950 dark:text-white mb-2">正在生成题目...</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">AI 正在根据考试大纲为你准备专属题库</p>
              <Progress value={loadingProgress} className="h-2 mb-2" />
              <p className="text-sm text-neutral-500">{loadingProgress}%</p>
            </div>
          </Card>
        )}

        {/* 加载错误 */}
        {!isLoadingQuestions && loadingError && !usingFallback && (
          <Card className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-neutral-950 dark:text-white mb-2">题目加载失败</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">{loadingError}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重新加载
              </Button>
            </div>
          </Card>
        )}

        {/* 使用备用题库提示 */}
        {!isLoadingQuestions && usingFallback && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>AI 出题暂时不可用，已切换为备用题库</span>
            </div>
          </div>
        )}
 {/* 题目卡片 */}
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
              disabled={showFeedback || isPaused}
            />
        {/* 正常显示答题区 */}
        {!isLoadingQuestions && questions.length > 0 && (
          <div className="space-y-4">
            {/* 统计面板在上方 */}
            <RankPanel rankState={rankState} totalQuestions={questions.length} />

           

          
          </div>
        )}
      </main>

      {/* 答题反馈弹窗 */}
      {lastAnswer && (
        <AnswerFeedback
          isOpen={showFeedback}
          isCorrect={lastAnswer.isCorrect}
          question={currentQuestion}
          userAnswer={lastAnswer.userAnswer}
          pointsChange={lastAnswer.pointsChange}
          currentPoints={rankState.points}
          comboCount={rankState.currentCombo}
          isLastQuestion={currentIndex === questions.length - 1}
          partialScore={lastAnswer.partialScore}
          onFollowUp={() => {
            setShowFeedback(false)
            setShowFollowUp(true)
          }}
          onAddToWrongBook={handleAddToWrongBook}
          onNext={handleNext}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* 追问模式 */}
      {currentQuestion && (
        <FollowUpChat
          isOpen={showFollowUp}
          question={currentQuestion}
          onClose={() => {
            setShowFollowUp(false)
            handleNext()
          }}
        />
      )}

      {/* 降级/作弊警告 */}
      <DemotionWarning
        isOpen={showWarning && !showFeedback}
        warningLevel={warningLevel}
        currentRank={prevRank || rankState.rank}
        newRank={warningLevel === 3 ? rankState.rank : undefined}
        consecutiveWrong={warningConsecutiveWrong}
        cheatDetected={cheatWarning.detected}
        cheatMessage={cheatWarning.message}
        onClose={() => {
          setShowWarning(false)
          setCheatWarning({ detected: false, message: '' })
          setPrevRank(null)
        }}
        onGoReview={() => {
          setShowWarning(false)
          router.push('/exam/review')
        }}
      />

      {/* 练习完成结算卡片 */}
      {isCompleted && (
        <PracticeComplete
          examName={examName}
          rankState={rankState}
          totalQuestions={questions.length}
          correctCount={rankState.todayCorrect}
          wrongCount={rankState.todayWrong}
          wrongQuestionsCount={wrongQuestions.length}
          onRestart={handleRestart}
          onGoHome={() => router.push('/')}
          onGoReview={() => router.push('/exam/review')}
          onViewDetails={() => router.push('/exam/review')}
        />
      )}

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-950 dark:text-white">确认退出？</h3>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
              你当前在第 {currentIndex + 1} 题，进度已自动保存。<br />
              下次回来可以继续答题哦~
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                继续答题
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false)
                  router.push('/')
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                确认退出
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
