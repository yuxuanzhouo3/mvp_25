'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Requirement, extractRequirementsFromUserMessage, mergeRequirements, hasQuestionCount, parseRequirements, detectUserConfirmIntent, extractAiSuggestedRequirements } from '@/lib/requirement-parser'
import { RequirementTags } from './RequirementTags'
import { QuickActionChips } from './QuickActionChips'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface DocumentAiAgentProps {
  documentContent: string
  documentName?: string
  onStartGeneration: (requirements: Requirement[], questionCount: number) => void
}

export function DocumentAiAgent({ documentContent, documentName, onStartGeneration }: DocumentAiAgentProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 初始化：调用 AI 分析文档并生成开场白
  useEffect(() => {
    if (!isInitialized && documentContent) {
      setIsInitialized(true)
      analyzeDocument()
    }
  }, [documentContent, isInitialized])

  const analyzeDocument = async () => {
    setIsStreaming(true)
    try {
      const response = await fetch('/api/exam/ai-document-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          history: [],
          documentContent,
          isInitialAnalysis: true
        })
      })

      if (!response.ok) throw new Error('API request failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      setMessages([{ role: 'assistant', content: '' }])

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // 清理内容：移除完整的 JSON 块和不完整的 JSON 开始标签
        let cleanContent = buffer.replace(/<<<JSON>>>[\s\S]*?<<<JSON>>>/g, '')
        // 如果存在未闭合的 JSON 标签，移除从标签开始到末尾的所有内容
        const unclosedJsonIndex = cleanContent.lastIndexOf('<<<JSON>>>')
        if (unclosedJsonIndex !== -1) {
          cleanContent = cleanContent.substring(0, unclosedJsonIndex)
        }
        cleanContent = cleanContent.trim()

        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = cleanContent
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      setMessages([{ role: 'assistant', content: '抱歉，文档分析失败。请重试。' }])
    } finally {
      setIsStreaming(false)
    }
  }

  const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 清理内容：移除完整的 JSON 块和不完整的 JSON 开始标签
      let cleanContent = buffer.replace(/<<<JSON>>>[\s\S]*?<<<JSON>>>/g, '')
      // 如果存在未闭合的 JSON 标签，移除从标签开始到末尾的所有内容
      const unclosedJsonIndex = cleanContent.lastIndexOf('<<<JSON>>>')
      if (unclosedJsonIndex !== -1) {
        cleanContent = cleanContent.substring(0, unclosedJsonIndex)
      }
      cleanContent = cleanContent.trim()

      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1].content = cleanContent
        return newMessages
      })

      // 实时提取标签（从AI响应中）
      const newRequirements = parseRequirements(buffer)
      if (newRequirements.length > 0) {
        setRequirements(prev => mergeRequirements(prev, newRequirements))
      }
    }

    return buffer
  }

  const handleSend = async (message: string) => {
    if (!message.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // 【新增】立即从用户消息中提取需求（前端正则）
    const userRequirements = extractRequirementsFromUserMessage(message)
    if (userRequirements.length > 0) {
      setRequirements(prev => mergeRequirements(prev, userRequirements))
    }

    try {
      // 构建历史消息（排除初始的硬编码消息）
      const history = messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/exam/ai-document-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          documentContent: history.length === 0 ? documentContent : ''
        })
      })

      if (!response.ok) throw new Error('API request failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      // 添加空的助手消息
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      // 处理流式响应
      const assistantMessage = await processStream(reader)

      // 从AI响应中提取JSON格式的需求
      const aiRequirements = parseRequirements(assistantMessage)
      if (aiRequirements.length > 0) {
        setRequirements(prev => mergeRequirements(prev, aiRequirements))
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

  const handleStartGeneration = () => {
    const countReq = requirements.find(r => r.category === '数量')
    if (countReq) {
      const count = parseInt(countReq.value.replace(/[^\d]/g, ''))
      if (count > 0 && count <= 40) {
        onStartGeneration(requirements, count)
      }
    }
  }

  const canGenerate = hasQuestionCount(requirements)

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
                {msg.content || (msg.role === 'assistant' ? '...' : '')}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isStreaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
            <div className="flex gap-3 items-start justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm">{t.exam.aiThinking}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <QuickActionChips onChipClick={handleSend} />

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
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
        onClick={handleStartGeneration}
        disabled={!canGenerate}
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        确认生成
      </button>
      {!canGenerate && (
        <p className="text-sm text-red-500 mt-2 text-center">
          请先确认题目数量
        </p>
      )}
    </div>
  )
}
