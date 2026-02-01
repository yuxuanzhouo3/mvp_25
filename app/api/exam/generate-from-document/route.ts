import { NextRequest, NextResponse } from 'next/server';
import { getDocumentQuestionsPrompts } from '@/lib/i18n/ai-prompts';

/**
 * 基于文档内容生成题目 API
 *
 * 根据用户上传的文档内容，使用 AI 生成选择题和填空题
 */

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 题目类型定义
export type QuestionType = 'single' | 'multiple' | 'fill';

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[]; // 选择题选项
  correctAnswer: number | number[] | string[]; // 单选: number, 多选: number[], 填空: string[]
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  knowledgePoint: string;
  blanksCount?: number; // 填空题的空数量
}

export async function POST(request: NextRequest) {
  try {
    const { documentContent, examName, count = 10, requirements = [] } = await request.json();

    if (!documentContent || documentContent.trim().length === 0) {
      return NextResponse.json(
        { error: '请提供文档内容' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 40) {
      return NextResponse.json(
        { error: '出题数量必须在 1-40 之间' },
        { status: 400 }
      );
    }

    // 获取区域适配的 AI 提示词
    const prompts = getDocumentQuestionsPrompts();

    // 构建出题提示词
    const prompt = buildDocumentQuestionPrompt(documentContent, examName, count, requirements);

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
        temperature: 0.7,
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
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      // 验证并修复题目数据
      questions = questions.map((q, index) => {
        const baseQuestion = {
          id: q.id || `doc-${Date.now()}-${index}`,
          type: validateQuestionType(q.type),
          content: q.content || '题目加载失败',
          explanation: q.explanation || '暂无解析',
          difficulty: validateDifficulty(q.difficulty),
          knowledgePoint: q.knowledgePoint || '综合'
        };

        if (baseQuestion.type === 'fill') {
          // 填空题
          const blanksCount = (q.content?.match(/____/g) || []).length || 1;
          return {
            ...baseQuestion,
            correctAnswer: Array.isArray(q.correctAnswer)
              ? q.correctAnswer.map(String)
              : [String(q.correctAnswer)],
            blanksCount
          };
        } else {
          // 选择题（单选或多选）
          return {
            ...baseQuestion,
            options: Array.isArray(q.options) && q.options.length === 4
              ? q.options
              : ['选项A', '选项B', '选项C', '选项D'],
            correctAnswer: baseQuestion.type === 'multiple'
              ? validateMultipleAnswer(q.correctAnswer)
              : validateSingleAnswer(q.correctAnswer)
          };
        }
      });

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
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('基于文档出题失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 构建基于文档的出题提示词
 */
function buildDocumentQuestionPrompt(
  documentContent: string,
  examName: string,
  count: number,
  requirements: any[]
): string {
  // 提取题型要求
  const questionTypeReq = requirements.find(r => r.category === '题型');
  const difficultyReq = requirements.find(r => r.category === '难度');

  // 构建题型指令
  let questionTypeInstructions = '';
  if (questionTypeReq) {
    const type = questionTypeReq.value;
    if (type === '填空题') {
      questionTypeInstructions = '- 全部生成填空题 (type: "fill")，题目中用"____"表示空位';
    } else if (type === '选择题') {
      questionTypeInstructions = '- 全部生成选择题（单选或多选）';
    } else if (type === '判断题') {
      questionTypeInstructions = '- 全部生成判断题（作为单选题，选项为"正确"和"错误"）';
    }
  } else {
    questionTypeInstructions = '- 根据文档内容自动决定题型（单选题、多选题、填空题）';
  }

  // 构建难度指令
  let difficultyInstructions = '';
  if (difficultyReq) {
    const difficulty = difficultyReq.value;
    if (difficulty === '简单') {
      difficultyInstructions = '- 简单题（难度1-2）：100%';
    } else if (difficulty === '中等') {
      difficultyInstructions = '- 中等题（难度3）：100%';
    } else if (difficulty === '困难') {
      difficultyInstructions = '- 困难题（难度4-5）：100%';
    }
  } else {
    const easyCount = Math.round(count * 0.4);
    const mediumCount = Math.round(count * 0.4);
    const hardCount = count - easyCount - mediumCount;
    difficultyInstructions = `- 简单题（难度1-2）：约 ${easyCount} 道\n- 中等题（难度3）：约 ${mediumCount} 道\n- 困难题（难度4-5）：约 ${hardCount} 道`;
  }

  return `请根据以下文档内容，为【${examName || '考试'}】生成 ${count} 道高质量题目。

难度分布要求：
${difficultyInstructions}

题型要求：
${questionTypeInstructions}
- 如果文档中有明确的概念定义，适合出填空题
- 如果有多个相关知识点，适合出多选题
- 多选题的题目内容必须以"【多选题】"开头

文档内容：
"""
${documentContent}
"""

请直接返回 JSON 格式的题目，不要包含其他内容。`;
}

/**
 * 验证题目类型
 */
function validateQuestionType(type: string): QuestionType {
  if (['single', 'multiple', 'fill'].includes(type)) {
    return type as QuestionType;
  }
  return 'single';
}

/**
 * 验证难度
 */
function validateDifficulty(difficulty: number): 1 | 2 | 3 | 4 | 5 {
  if (typeof difficulty === 'number' && difficulty >= 1 && difficulty <= 5) {
    return difficulty as 1 | 2 | 3 | 4 | 5;
  }
  return 2;
}

/**
 * 验证单选答案
 */
function validateSingleAnswer(answer: unknown): number {
  if (typeof answer === 'number' && answer >= 0 && answer <= 3) {
    return answer;
  }
  return 0;
}

/**
 * 验证多选答案
 */
function validateMultipleAnswer(answer: unknown): number[] {
  if (Array.isArray(answer)) {
    const validAnswers = answer
      .filter(a => typeof a === 'number' && a >= 0 && a <= 3)
      .map(Number);
    if (validAnswers.length >= 2) {
      return validAnswers;
    }
  }
  return [0, 1];
}

/**
 * GET 请求 - 返回 API 信息
 */
export async function GET() {
  return NextResponse.json({
    name: '基于文档内容出题 API',
    description: '根据用户上传的文档内容，使用 AI 生成选择题和填空题',
    parameters: {
      documentContent: '文档文本内容（必填）',
      examName: '考试名称（可选）',
      count: '题目数量，1-40（默认10）'
    },
    questionTypes: ['single', 'multiple', 'fill']
  });
}
