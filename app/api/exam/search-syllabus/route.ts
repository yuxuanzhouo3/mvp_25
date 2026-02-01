import { NextRequest, NextResponse } from 'next/server';
import { getSearchGuidancePrompts } from '@/lib/i18n/ai-prompts';

/**
 * 联网搜索考试大纲 API
 *
 * 使用阿里通义千问的联网搜索功能，获取最新的考试大纲和题型信息
 */

// 通义千问联网搜索需要使用原生 fetch，因为 OpenAI SDK 不支持 enable_search 参数
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { examType, examName, requirements } = await request.json();

    if (!examType || !examName) {
      return NextResponse.json(
        { error: '请提供考试类型和名称' },
        { status: 400 }
      );
    }

    // 获取区域适配的 AI 提示词
    const prompts = getSearchGuidancePrompts();

    // 构建搜索提示词
    const searchPrompt = buildSearchPrompt(examType, examName, requirements);

    // 调用通义千问 API，启用联网搜索
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_SEARCH_MODEL_NAME || 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: prompts.systemPrompt
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        // 启用联网搜索 - 这是通义千问的关键参数
        enable_search: true,
        // 返回搜索结果引用
        search_options: {
          enable_source: true,
          enable_citation: true,
          search_strategy: 'standard' // standard | pro
        },
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('通义千问 API 错误:', errorData);
      return NextResponse.json(
        { error: '联网搜索失败，请稍后重试', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json(
        { error: 'AI 返回内容为空' },
        { status: 500 }
      );
    }

    // 解析 AI 返回的 JSON
    let syllabusData;
    try {
      syllabusData = JSON.parse(aiContent);
    } catch {
      // 如果 JSON 解析失败，返回原始文本
      syllabusData = { rawContent: aiContent };
    }

    // 获取搜索引用信息（如果有）
    const searchInfo = data.choices?.[0]?.message?.search_info || null;

    return NextResponse.json({
      success: true,
      data: syllabusData,
      searchInfo: searchInfo,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('联网搜索考试大纲失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 构建搜索提示词
 */
function buildSearchPrompt(examType: string, examName: string, requirements?: string): string {
  // 获取区域适配的提示词
  const prompts = getSearchGuidancePrompts();
  const examPrompts = prompts.examTypes;

  // 根据考试类型获取对应的提示词函数
  const promptFn = examPrompts[examType as keyof typeof examPrompts] || examPrompts.default;

  // 调用函数生成提示词
  if (examType === 'postgraduate' || examType === 'civilService' || examType === 'professional' || examType === 'default') {
    return promptFn(examName, requirements);
  } else {
    // cet4, cet6 不需要 examName 参数
    return (promptFn as (requirements?: string) => string)(requirements);
  }
}

/**
 * GET 请求 - 返回支持的考试类型
 */
export async function GET() {
  return NextResponse.json({
    supportedExamTypes: [
      { id: 'postgraduate', name: '考研', description: '硕士研究生入学考试' },
      { id: 'cet4', name: '英语四级', description: '大学英语四级考试 CET-4' },
      { id: 'cet6', name: '英语六级', description: '大学英语六级考试 CET-6' },
      { id: 'civilService', name: '公务员', description: '国家/省级公务员考试' },
      { id: 'professional', name: '职业资格', description: '各类职业资格证书考试' }
    ],
    features: [
      '联网搜索最新考试大纲',
      '获取官方题型分布',
      '智能分析备考重点',
      '提供学习资源推荐'
    ]
  });
}
