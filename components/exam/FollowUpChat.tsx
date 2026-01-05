"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Send, Bot, User, Lightbulb, Loader2 } from "lucide-react"
import { getMockAIResponse, getSuggestedQuestions, type Question } from "@/lib/exam-mock-data"

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface FollowUpChatProps {
  isOpen: boolean
  question: Question
  onClose: () => void
}

export function FollowUpChat({ isOpen, question, onClose }: FollowUpChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const suggestedQuestions = getSuggestedQuestions(question)
  const lastQuestionIdRef = useRef<string | null>(null)

  // 当题目变化时，重置聊天记录
  useEffect(() => {
    if (question?.id && question.id !== lastQuestionIdRef.current) {
      // 题目变化，清空聊天记录
      setMessages([])
      setStreamingText('')
      lastQuestionIdRef.current = question.id
    }
  }, [question?.id])

  // 初始化欢迎消息（仅当打开且消息为空时）
  useEffect(() => {
    if (isOpen && messages.length === 0 && question) {
      setMessages([{
        role: 'assistant',
        content: `我来帮你深入理解这道关于"${question.knowledgePoint}"的题目。\n\n你可以问我任何关于这道题或相关知识点的问题，比如：\n• 为什么答案是这个？\n• 能举个例子吗？\n• 有没有类似的题目？`
      }])
    }
  }, [isOpen, messages.length, question])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // 流式输出效果
  const streamText = useCallback((fullText: string, onComplete: () => void) => {
    let currentIndex = 0
    setStreamingText('')

    const intervalId = setInterval(() => {
      if (currentIndex < fullText.length) {
        // 每次添加 1-3 个字符，模拟打字效果
        const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, fullText.length - currentIndex)
        currentIndex += charsToAdd
        setStreamingText(fullText.slice(0, currentIndex))
      } else {
        clearInterval(intervalId)
        setStreamingText('')
        onComplete()
      }
    }, 30) // 30ms 间隔

    return () => clearInterval(intervalId)
  }, [])

  // 发送消息 - 调用真实 AI API
  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return

    // 添加用户消息
    const userMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userMessage: content,
          chatHistory: messages
        })
      })

      const data = await response.json()

      if (data.success && data.reply) {
        // 使用流式输出效果
        streamText(data.reply, () => {
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        })
      } else {
        // API 返回错误，使用备用回复
        const fallbackReply = getMockAIResponse(content)
        streamText(fallbackReply, () => {
          setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply }])
        })
      }
    } catch (error) {
      console.error('追问 API 调用失败:', error)
      // 网络错误，使用备用回复
      const errorReply = '抱歉，网络出现问题，请稍后重试。'
      streamText(errorReply, () => {
        setMessages(prev => [...prev, { role: 'assistant', content: errorReply }])
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 使用推荐问题
  const handleSuggestedQuestion = (q: string) => {
    handleSend(q)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl h-[80vh] bg-slate-800 border-slate-700 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">追问模式</h3>
              <p className="text-sm text-slate-400">与 AI 深度交互，彻底弄懂这道题</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 题目信息 */}
        <div className="px-6 py-3 bg-slate-700/30 border-b border-slate-700">
          <p className="text-sm text-slate-300 line-clamp-2">{question.content}</p>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* 头像 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant'
                    ? 'bg-purple-600'
                    : 'bg-blue-600'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* 消息气泡 */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'assistant'
                    ? 'bg-slate-700 text-slate-200 rounded-tl-none'
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* 流式输出中 */}
          {streamingText && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[80%] bg-slate-700 text-slate-200 rounded-2xl rounded-tl-none px-4 py-3">
                <p className="whitespace-pre-wrap">{streamingText}<span className="inline-block w-1 h-4 bg-purple-400 animate-pulse ml-1" /></p>
              </div>
            </div>
          )}

          {/* 加载中（等待 API 响应） */}
          {isLoading && !streamingText && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 推荐问题 */}
        {messages.length <= 2 && (
          <div className="px-6 py-3 border-t border-slate-700 bg-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-400">推荐问题</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-sm px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-full transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="px-6 py-4 border-t border-slate-700">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && !streamingText && handleSend(input)}
              placeholder="输入你的问题..."
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              disabled={isLoading || !!streamingText}
            />
            <Button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading || !!streamingText}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-slate-500">按 Enter 发送消息</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              结束追问，继续刷题
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
