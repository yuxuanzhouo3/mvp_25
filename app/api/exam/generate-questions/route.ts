import { NextRequest, NextResponse } from 'next/server';
import { getQuestionGenerationPrompts } from '@/lib/i18n/ai-prompts';

/**
 * AI 动态出题 API
 *
 * 根据考试大纲信息，使用 AI 生成对应科目的选择题
 */

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 题目类型定义
interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  knowledgePoint: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const { examType, examName, syllabus, count = 20, requirements } = await request.json();

    if (!examName) {
      return NextResponse.json(
        { error: '请提供考试名称' },
        { status: 400 }
      );
    }

    // 获取区域适配的 AI 提示词
    const prompts = getQuestionGenerationPrompts();

    // 构建出题提示词
    const prompt = buildQuestionPrompt(examType, examName, syllabus, count, requirements);

    // 调用通义千问 API 生成题目
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME || 'qwen-max',
        messages: [
          {
            role: 'system',
            content: prompts.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('通义千问 API 错误:', errorData);
      return NextResponse.json(
        { error: 'AI 出题失败，请稍后重试', details: errorData },
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
    let questions: GeneratedQuestion[];
    try {
      const parsed = JSON.parse(aiContent);
      // AI 可能返回 { questions: [...] } 或直接返回数组
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      // 验证并修复题目数据
      questions = questions.map((q, index) => ({
        id: q.id || `gen-${Date.now()}-${index}`,
        question: q.question || '题目加载失败',
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ['选项A', '选项B', '选项C', '选项D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : 0,
        explanation: q.explanation || '暂无解析',
        difficulty: typeof q.difficulty === 'number' && q.difficulty >= 1 && q.difficulty <= 5
          ? q.difficulty
          : 2,
        knowledgePoint: q.knowledgePoint || '综合',
        category: q.category || examName
      }));

    } catch (parseError) {
      console.error('解析 AI 返回内容失败:', parseError);
      return NextResponse.json(
        { error: '题目格式解析失败', rawContent: aiContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      examName,
      examType,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('AI 出题失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 构建出题提示词
 */
function buildQuestionPrompt(
  examType: string,
  examName: string,
  syllabus: Array<{ chapter: string; keyPoints?: string[] }> | null,
  count: number,
  requirements?: string
): string {
  // 获取区域适配的提示词
  const prompts = getQuestionGenerationPrompts();
  const examRequirements = prompts.examTypes;

  // 基础提示
  let prompt = `请为【${examName}】考试生成 ${count} 道高质量选择题。\n\n`;

  // 添加用户需求
  if (requirements) {
    prompt += `用户特定需求：${requirements}\n\n`;
  }

  // 根据考试类型添加特定要求
  prompt += examRequirements[examType as keyof typeof examRequirements] || examRequirements.default;

  // 如果有考纲信息，加入考纲要求
  if (syllabus && syllabus.length > 0) {
    prompt += '\n\n根据以下考纲章节出题，确保每个章节都有涉及：\n';
    syllabus.forEach((item, index) => {
      prompt += `${index + 1}. ${item.chapter}`;
      if (item.keyPoints && item.keyPoints.length > 0) {
        prompt += `（重点：${item.keyPoints.slice(0, 3).join('、')}）`;
      }
      prompt += '\n';
    });
  }

  prompt += `\n\n请直接返回 JSON 格式的题目数组，不要包含其他内容。`;

  return prompt;
}

/**
 * GET 请求 - 返回 API 信息
 */
export async function GET() {
  return NextResponse.json({
    name: 'AI 动态出题 API',
    description: '根据考试大纲信息，使用 AI 生成对应科目的选择题',
    supportedExamTypes: ['cet4', 'cet6', 'postgraduate', 'civilService', 'default'],
    parameters: {
      examType: '考试类型',
      examName: '考试名称',
      syllabus: '考纲章节信息（可选）',
      count: '题目数量（默认20）'
    }
  });
}
