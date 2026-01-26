'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Requirement, parseRequirements, mergeRequirements, hasSubject } from '@/lib/requirement-parser'
import { RequirementTags } from './RequirementTags'
import { QuickActionChips } from './QuickActionChips'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiRequirementAgentProps {
  onStartGeneration: (requirements: Requirement[]) => void
}

export function AiRequirementAgent({ onStartGeneration }: AiRequirementAgentProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是 AI 备考规划师。请告诉我你想练习什么科目的题目？' }
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (message: string) => {
    if (!message.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    try {
      const response = await fetch('/api/exam/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages })
      })

      if (!response.ok) throw new Error('API request failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = assistantMessage
          return newMessages
        })

        const newRequirements = parseRequirements(assistantMessage)
        if (newRequirements.length > 0) {
          setRequirements(prev => mergeRequirements(prev, newRequirements))
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，发生了错误。请重试。' }])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleRemoveRequirement = (category: Requirement['category']) => {
    setRequirements(prev => prev.filter(r => r.category !== category))
  }

  return (
    <div className="space-y-4">
      {requirements.length > 0 && (
        <RequirementTags requirements={requirements} onRemove={handleRemoveRequirement} />
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-[400px] overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 items-start ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white px-4 py-3 rounded-2xl'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {msg.content.replace(/<<<JSON>>>.*?<<<JSON>>>/gs, '').trim()}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <QuickActionChips onChipClick={handleSend} />

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="输入你的消息..."
          disabled={isStreaming}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isStreaming || !input.trim()}
          className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={() => {
          console.log('开始出题按钮点击, requirements:', requirements)
          onStartGeneration(requirements)
        }}
        disabled={!hasSubject(requirements)}
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        开始出题
      </button>
      {!hasSubject(requirements) && requirements.length > 0 && (
        <p className="text-sm text-red-500 mt-2 text-center">
          请先选择科目（如：英语、数学、语文等）
        </p>
      )}
    </div>
  )
}
