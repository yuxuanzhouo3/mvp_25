"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Brain, Send, Sparkles, MessageCircle } from "lucide-react"

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

interface AiCoachModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile: UserProfile
  userSkills: UserSkills
  onComplete: (sessionData: any) => void
  sessionsLeft: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AiCoachModal({
  isOpen,
  onClose,
  userProfile,
  userSkills,
  onComplete,
  sessionsLeft
}: AiCoachModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `你好 ${userProfile.name}！我是你的 AI 教练。基于你的技能评估结果，我发现你在某些领域表现出色，但也有一些可以提升的地方。有什么我可以帮助你的吗？`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const suggestedQuestions = [
    '如何提升我的薄弱技能？',
    '给我制定一个学习计划',
    '分析我的竞争优势',
    '推荐适合我的职业方向'
  ]

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `根据你的技能评估，我建议你可以重点关注以下几个方面的提升...`,
        `你的${userProfile.role}角色定位很准确。为了进一步提升竞争力，建议...`,
        `很好的问题！基于你目前${userProfile.competitivenessScore}分的竞争力指数，我认为...`,
        `我分析了你的技能数据，发现你在某些领域已经很强了，但还可以通过...`
      ]
      const aiMessage: Message = {
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)]
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }

  const handleComplete = () => {
    onComplete({ messages, timestamp: Date.now() })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] bg-slate-800 border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI 教练</h2>
              <p className="text-xs text-slate-400">
                {sessionsLeft === -1 ? '无限次数' : `剩余 ${sessionsLeft} 次体验`}
              </p>
            </div>
          </div>
          <button
            onClick={handleComplete}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-2xl px-4 py-3 text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  正在思考...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        <div className="px-4 py-2 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">快速提问：</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入你的问题..."
              className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
