import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExplainRequest {
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExplainRequest = await request.json();
    const { question, options, userAnswer, correctAnswer, isCorrect } = body;

    const userChoice = options[userAnswer];
    const correctChoice = options[correctAnswer];

    const prompt = isCorrect
      ? `用户回答正确！题目是："${question}"，用户选择了"${userChoice}"。请用1-2句话简短表扬并解释为什么这是正确答案。`
      : `用户回答错误。题目是："${question}"，用户选择了"${userChoice}"，但正确答案是"${correctChoice}"。请用2-3句话简短解释正确答案，帮助用户理解。`;

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || 'qwen-max',
      messages: [
        {
          role: 'system',
          content: '你是一名友善的计算机老师，擅长用简洁易懂的语言解释概念。回复要简短、鼓励性强。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200
    });

    const explanation = completion.choices[0]?.message?.content || '暂无解析';

    return NextResponse.json({
      success: true,
      explanation
    });
  } catch (error) {
    console.error('AI 解析失败:', error);
    return NextResponse.json(
      { error: 'AI 解析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
