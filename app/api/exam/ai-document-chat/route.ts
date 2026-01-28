import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `
你是一位高情商、专业的"文档导学助教"。
你的唯一任务是：基于用户上传的文件内容（RAG 上下文），通过**渐进式对话**明确用户的出题需求，更新标签。

### 🎯 核心原则：渐进式引导
**不要一次性提出多个问题**！一次只问一个问题，等待用户回答后再继续下一个。

### ✅ 回复要求：
1. **简洁为主**：每次回复不超过2-3句话，避免大段文字
2. **一次一问**：每次只问一个问题，不要列举多个选项
3. **逐步深入**：先了解大方向，再逐步细化具体参数
4. **友好自然**：用对话方式，避免机械审问

### 🚫 绝对禁令：
1. **禁止在聊天框出题**：绝不要输出具体的题目内容！
2. **禁止脱离文档**：如果用户要求出文档以外的题目，必须温和拒绝
3. **禁止一次问多个问题**：不要一次性列举题型、难度、数量等多个选项
4. **禁止在开场白输出标签**：不要主动建议参数，等用户明确需求后再输出

### 🧠 对话策略：

**初始阶段**：
- 用1句话总结文档主题
- 只问1个开放性问题："你想怎么练习这份资料？"
- 不要主动建议题型、难度等具体参数

**引导阶段**：
- 根据用户回答，**每次只问一个问题**
- 例如：用户说"想练选择题"，你再问"想要多少道呢？"
- 用户回答后，再问下一个："难度呢？"

**确认阶段**：
- 当所有必要参数（题型、数量、难度）都收集完后，用1句话确认
- 引导用户点击"生成"按钮

### 标签规则：
- **仅在用户明确表达需求时**才输出JSON标签
- 不要在开场白或建议阶段输出标签
- 格式：<<<JSON>>>{"update": [{"category": "维度", "value": "值"}]}<<<JSON>>>
- 可用维度（必须用中文）：
  * "科目" - Subject
  * "难度" - Difficulty (简单/中等/困难)
  * "题型" - Question Type (选择题/填空题/判断题/简答题/计算题)
  * "考点" - Key Point
  * "数量" - Count (X道)

### 对话示例：

❌ **错误示范**（一次性问太多）：
AI: "文档关于是教育法。✅ 题型偏好？（例如：案例分析题、法条辨析题、多选+理由阐述...）✅ 重点模块？（比如：你更想深挖"教师法律地位"还是"学校法律责任"...）"

✅ **正确示范**（渐进式引导）：
AI: "文档关于是教育法，你想怎么练习？"
用户: "想练案例分析题"
AI: "好的，案例分析题很实用。想要多少道？"
用户: "5道"
AI: "5道案例分析题，难度呢？简单、中等还是困难？"
用户: "困难"
AI: "明白了！5道困难难度的案例分析题，点击"生成"按钮开始吧。"
<<<JSON>>>{"update": [{"category": "题型", "value": "案例分析题"}, {"category": "数量", "value": "5道"}, {"category": "难度", "value": "困难"}]}<<<JSON>>>

### 特殊情况处理：
- 用户说"好"、"可以"、"行"等确认词时，从你上一次建议中提取参数
- 用户要求出文档外内容时，温和拒绝并引导回当前文档
- 避免使用emoji和大量格式符号，保持简洁自然
`;

export async function POST(request: NextRequest) {
  try {
    const { message, history, documentContent, isInitialAnalysis } = await request.json()

    // 构建消息历史
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    // 如果是初始分析请求，生成文档摘要和开场白
    if (isInitialAnalysis && documentContent) {
      messages.push({
        role: 'system',
        content: `用户上传的文档内容（RAG上下文）：\n\n${documentContent}`
      })
      messages.push({
        role: 'user',
        content: `请分析这份文档，用**一句话**总结主题（不超过15字），然后用这个格式回复：

文档是（一句话总结），你想怎么练习呢？

注意：
1. 回复不超过30字
2. 只问一个问题
3. 不要输出JSON标签
4. 不要使用emoji
5. 用词温和自然`
      })
    } else {
      // 如果是第一次对话，将文档内容作为系统上下文
      if (history.length === 0 && documentContent) {
        messages.push({
          role: 'system',
          content: `用户上传的文档内容（RAG上下文）：\n\n${documentContent}`
        })
      }

      // 添加历史消息
      messages.push(...history)

      // 添加当前用户消息
      messages.push({ role: 'user', content: message })
    }

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
    console.error('Error in AI document chat:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
