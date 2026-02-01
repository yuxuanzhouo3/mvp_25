import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

interface Question {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  knowledgePoint: string;
  category: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FollowUpRequest {
  question: Question;
  userMessage: string;
  chatHistory: Message[];
}

export async function POST(request: NextRequest) {
  try {
    const body: FollowUpRequest = await request.json();
    const { question, userMessage, chatHistory } = body;

    if (!question || !userMessage) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 构建选项文本
    const optionsText = question.options
      .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`)
      .join('\n');

    // 构建系统提示词
    const systemPrompt = `你是一位耐心、专业的考试辅导老师。你正在帮助学生理解一道题目。

当前题目信息：
【题目】${question.content}

【选项】
${optionsText}

【正确答案】${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}

【知识点】${question.knowledgePoint}

【分类】${question.category}

【官方解析】${question.explanation}

请根据学生的问题，结合以上题目信息，给出详细、易懂的解答。
- 如果学生问"为什么"，请解释原因和逻辑
- 如果学生问"能举个例子吗"，请给出相关的实际例子
- 如果学生说"还是不懂"，请用更简单的方式重新解释
- 回答要有条理，语气友善鼓励`;

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加聊天历史（最多保留最近6轮对话）
    const recentHistory = chatHistory.slice(-12);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // 添加当前用户问题
    messages.push({
      role: 'user',
      content: userMessage
    });

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || 'qwen-max',
      messages,
      max_tokens: 800,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content || '抱歉，我暂时无法回答这个问题。';

    return NextResponse.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error('追问 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
