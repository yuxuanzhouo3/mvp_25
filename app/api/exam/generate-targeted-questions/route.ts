import { NextRequest, NextResponse } from 'next/server';

/**
 * AI 针对性出题 API
 *
 * 根据用户评估结果的薄弱环节，生成针对性的练习题目
 * 题目分布：60%薄弱项 + 30%中等项 + 10%优势项
 */

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 请求参数类型
interface WeakDimension {
  id: string;
  name: string;
  score: number;
  description: string;
}

interface RequestBody {
  subjectName: string;
  weakDimensions: WeakDimension[];
  mediumDimensions?: WeakDimension[];
  strongDimensions?: WeakDimension[];
  count?: number;
}

// 生成的题目类型
interface GeneratedQuestion {
  id: string;
  type: 'single' | 'multiple' | 'fill';
  content: string;
  options?: string[];
  correctAnswer: number | number[] | string[];
  explanation: string;
  difficulty: number;
  knowledgePoint: string;
  dimensionId: string;
  dimensionName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      subjectName,
      weakDimensions = [],
      mediumDimensions = [],
      strongDimensions = [],
      count = 10
    } = body;

    if (!subjectName) {
      return NextResponse.json(
        { error: '请提供科目名称' },
        { status: 400 }
      );
    }

    if (weakDimensions.length === 0 && mediumDimensions.length === 0) {
      return NextResponse.json(
        { error: '请提供至少一个评估维度' },
        { status: 400 }
      );
    }

    // 计算各类型题目数量
    const weakCount = Math.ceil(count * 0.6);
    const mediumCount = Math.ceil(count * 0.3);
    const strongCount = count - weakCount - mediumCount;

    // 构建针对性出题提示词
    const prompt = buildTargetedPrompt(
      subjectName,
      weakDimensions,
      mediumDimensions,
      strongDimensions,
      { weakCount, mediumCount, strongCount }
    );

    // 调用通义千问 API 生成题目
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME || 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的个性化学习出题专家。你的任务是根据学生的能力评估结果，生成针对其薄弱环节的练习题目。

核心原则：
1. 题目必须精准针对学生的薄弱知识点
2. 难度要适中，既要有挑战性，又不能太难打击信心
3. 解析要详细，帮助学生真正理解知识点
4. 题目类型以单选题为主，确保可自动判分

题目格式要求（JSON数组）：
{
  "id": "唯一ID，如 tq-1",
  "type": "single",
  "content": "题目内容（清晰、准确）",
  "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
  "correctAnswer": 0,
  "explanation": "详细解析，包含知识点讲解",
  "difficulty": 3,
  "knowledgePoint": "具体知识点",
  "dimensionId": "对应的评估维度ID",
  "dimensionName": "对应的评估维度名称"
}

注意事项：
- correctAnswer 是正确选项的索引（0-3）
- difficulty 范围是 1-5（1最简单，5最难）
- 薄弱环节的题目难度建议 2-3
- 中等环节的题目难度建议 3-4
- 优势环节的题目难度建议 4-5`
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
      questions = questions.map((q, index) => ({
        id: q.id || `tq-${Date.now()}-${index}`,
        type: q.type || 'single',
        content: q.content || q.question || '题目加载失败',
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : 0,
        explanation: q.explanation || '暂无解析',
        difficulty: typeof q.difficulty === 'number' && q.difficulty >= 1 && q.difficulty <= 5
          ? q.difficulty
          : 3,
        knowledgePoint: q.knowledgePoint || '综合知识',
        dimensionId: q.dimensionId || 'unknown',
        dimensionName: q.dimensionName || '综合'
      }));

    } catch (parseError) {
      console.error('解析 AI 返回内容失败:', parseError);
      return NextResponse.json(
        { error: '题目格式解析失败', rawContent: aiContent },
        { status: 500 }
      );
    }

    // 获取涉及的维度列表
    const focusAreas = [
      ...weakDimensions.map(d => d.name),
      ...mediumDimensions.slice(0, 2).map(d => d.name)
    ];

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      subjectName,
      focusAreas,
      distribution: {
        weak: weakCount,
        medium: mediumCount,
        strong: strongCount
      },
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('AI 针对性出题失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 构建针对性出题提示词
 */
function buildTargetedPrompt(
  subjectName: string,
  weakDimensions: WeakDimension[],
  mediumDimensions: WeakDimension[],
  strongDimensions: WeakDimension[],
  counts: { weakCount: number; mediumCount: number; strongCount: number }
): string {
  let prompt = `请为【${subjectName}】考试生成针对性练习题，共 ${counts.weakCount + counts.mediumCount + counts.strongCount} 道题。\n\n`;

  // 薄弱环节（重点）
  if (weakDimensions.length > 0 && counts.weakCount > 0) {
    prompt += `## 薄弱环节（需生成 ${counts.weakCount} 道题，难度 2-3）\n`;
    prompt += `这些是学生最需要加强的领域，请重点出题：\n`;
    weakDimensions.forEach((dim, index) => {
      prompt += `${index + 1}. **${dim.name}**（当前水平：${dim.score}/10）\n`;
      prompt += `   - 描述：${dim.description}\n`;
      prompt += `   - dimensionId: ${dim.id}\n`;
    });
    prompt += `\n`;
  }

  // 中等环节
  if (mediumDimensions.length > 0 && counts.mediumCount > 0) {
    prompt += `## 巩固提升（需生成 ${counts.mediumCount} 道题，难度 3-4）\n`;
    prompt += `这些领域需要进一步巩固：\n`;
    mediumDimensions.forEach((dim, index) => {
      prompt += `${index + 1}. **${dim.name}**（当前水平：${dim.score}/10）\n`;
      prompt += `   - 描述：${dim.description}\n`;
      prompt += `   - dimensionId: ${dim.id}\n`;
    });
    prompt += `\n`;
  }

  // 优势环节
  if (strongDimensions.length > 0 && counts.strongCount > 0) {
    prompt += `## 优势保持（需生成 ${counts.strongCount} 道题，难度 4-5）\n`;
    prompt += `这些是学生的强项，可以出一些有挑战性的题目：\n`;
    strongDimensions.forEach((dim, index) => {
      prompt += `${index + 1}. **${dim.name}**（当前水平：${dim.score}/10）\n`;
      prompt += `   - dimensionId: ${dim.id}\n`;
    });
    prompt += `\n`;
  }

  prompt += `## 出题要求\n`;
  prompt += `1. 每道题必须标注对应的 dimensionId 和 dimensionName\n`;
  prompt += `2. 薄弱环节的题目要循序渐进，从基础概念入手\n`;
  prompt += `3. 解析要详细，帮助学生理解错误原因和正确思路\n`;
  prompt += `4. 选项设计要有迷惑性，但不能有歧义\n`;
  prompt += `5. 题目内容要紧扣考试要求，实用性强\n\n`;

  prompt += `请直接返回 JSON 格式的题目数组（包裹在 { "questions": [...] } 中），不要包含其他内容。`;

  return prompt;
}

/**
 * GET 请求 - 返回 API 信息
 */
export async function GET() {
  return NextResponse.json({
    name: 'AI 针对性出题 API',
    description: '根据用户评估结果的薄弱环节，生成针对性的练习题目',
    distribution: '60% 薄弱环节 + 30% 巩固提升 + 10% 优势保持',
    parameters: {
      subjectName: '科目名称（必填）',
      weakDimensions: '薄弱维度数组（必填）',
      mediumDimensions: '中等维度数组（可选）',
      strongDimensions: '优势维度数组（可选）',
      count: '题目总数（默认10）'
    }
  });
}
