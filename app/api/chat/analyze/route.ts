import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/cloudbase';

// 初始化 OpenAI 客户端（兼容阿里云通义千问）
const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 查询最新的评估记录
    const assessmentResult = await db
      .collection('assessments')
      .where({ userId: 'test_user_001' })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!assessmentResult.data || assessmentResult.data.length === 0) {
      return NextResponse.json(
        { error: '未找到用户评估数据，请先完成技能评估' },
        { status: 404 }
      );
    }

    const latestAssessment = assessmentResult.data[0];
    const skillsData = JSON.stringify(latestAssessment.skills);

    // 调用 AI 模型进行分析
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || 'qwen-plus',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是一名计算机老师。分析学生的技能数据，找出弱项并出题。返回 JSON: { analysis: "...", question: { title: "...", options: [], answer: 0, explanation: "..." } }'
        },
        {
          role: 'user',
          content: skillsData
        }
      ]
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI 响应为空' },
        { status: 500 }
      );
    }

    // 解析 AI 返回的 JSON
    const analysisResult = JSON.parse(aiResponse);

    return NextResponse.json({
      success: true,
      data: analysisResult,
      assessment: {
        role: latestAssessment.role,
        score: latestAssessment.score,
        createdAt: latestAssessment.createdAt
      }
    });
  } catch (error) {
    console.error('技能分析失败:', error);
    return NextResponse.json(
      { error: '技能分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
