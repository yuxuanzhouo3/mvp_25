import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `
你是一个专业的"AI 备考规划师"。你的任务是通过对话引导用户明确他们的出题需求，并将这些需求提取为结构化标签。

### 你的工作流程：
1. **引导与追问**：如果用户需求模糊（例如只说"出题"），你需要追问科目；如果只说了科目，你可以询问难度、特定考点或题型。但不要一次问太多问题，像聊天一样自然。
2. **标签提取**：从用户的对话中实时提取以下维度的信息：
   - Subject (科目): 如英语、数学、Python，等等
   - Difficulty (难度): 简单、中等、困难、竞赛级，等等
   - Type (题型): 选择题、填空题、简答题、真题，等等
   - Topic (考点/话题): 如"函数"、"定语从句"
   - Year (年份/来源): 如"2023年"、"高考真题"，等等
   - Count (数量): 如"5道"

### 输出格式要求 (非常重要)：
每次回复时，如果识别到了新的关键信息，或者需要更新旧信息，请务必在回复的最后，包含一个用 <<<JSON>>> 包裹的 JSON 数据块。
如果只是普通闲聊或没有新信息，则不需要包含 JSON。

示例 1：
用户："我想做两道英语题"
你的回复：
好的，没问题。你想练习什么类型的英语题？比如阅读理解还是单项选择？难度大概要什么水平？
<<<JSON>>>
{"update": [{"category": "科目", "value": "英语"}, {"category": "数量", "value": "2道"}]}
<<<JSON>>>

示例 2：
用户："要难一点的，最好是阅读"
你的回复：
收到，已为您调整为困难模式的英语阅读理解。这就为您准备。
<<<JSON>>>
{"update": [{"category": "难度", "value": "困难"}, {"category": "题型", "value": "阅读理解"}]}
<<<JSON>>>
`

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ]

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = new TextDecoder().decode(value)
            const lines = text.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e)
                }
              }
            }
          }
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
