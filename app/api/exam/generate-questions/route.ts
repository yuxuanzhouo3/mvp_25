import { NextRequest, NextResponse } from 'next/server';

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
    const { examType, examName, syllabus, count = 20 } = await request.json();

    if (!examName) {
      return NextResponse.json(
        { error: '请提供考试名称' },
        { status: 400 }
      );
    }

    // 构建出题提示词
    const prompt = buildQuestionPrompt(examType, examName, syllabus, count);

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
            content: `你是一个专业的考试出题专家。请根据用户提供的考试信息，生成高质量的选择题。

要求：
1. 题目必须符合该考试的真实难度和风格
2. 每道题必须有 4 个选项（A、B、C、D）
3. 必须提供正确答案和详细解析
4. 题目难度要有梯度分布（1-5 星）
5. 覆盖不同的知识点

请以 JSON 数组格式返回题目，每道题的格式如下：
{
  "id": "唯一ID",
  "question": "题目内容",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "correctAnswer": 0, // 正确答案索引 (0-3)
  "explanation": "详细解析",
  "difficulty": 2, // 难度 1-5
  "knowledgePoint": "知识点名称",
  "category": "所属章节/类别"
}`
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
  count: number
): string {
  // 基础提示
  let prompt = `请为【${examName}】考试生成 ${count} 道高质量选择题。\n\n`;

  // 根据考试类型添加特定要求
  const examRequirements: Record<string, string> = {
    'cet4': `
这是大学英语四级考试，题目类型应包括：
- 词汇语法题（考查词汇辨析、固定搭配、语法知识）
- 阅读理解题（考查细节理解、主旨大意、推理判断）
- 完形填空题（考查上下文理解、词汇运用）
- 翻译题知识点（考查中英互译能力）

难度要求：四级水平，词汇量约4500词`,

    'cet6': `
这是大学英语六级考试，题目类型应包括：
- 词汇语法题（考查高级词汇、复杂句式）
- 阅读理解题（考查深层理解、批判性思维）
- 完形填空题（考查语篇连贯、逻辑推理）
- 翻译题知识点（考查文化、经济、社会话题翻译）

难度要求：六级水平，词汇量约6000词`,

    'postgraduate': `
这是考研数学/英语/政治考试，题目应：
- 符合研究生入学考试难度
- 覆盖考纲重点内容
- 包含计算题、概念题、应用题等
- 难度分布：基础题40%、中等题40%、难题20%`,

    'civilService': `
这是公务员考试，题目类型应包括：
- 言语理解与表达
- 数量关系
- 判断推理（图形、定义、类比、逻辑）
- 资料分析
- 常识判断

难度要求：符合国考/省考真题难度`,

    'default': `
请根据考试特点生成合适的选择题，确保：
- 题目表述清晰准确
- 选项设置合理，干扰项有迷惑性
- 难度适中，有一定区分度`
  };

  prompt += examRequirements[examType] || examRequirements['default'];

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
