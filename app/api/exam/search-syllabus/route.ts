import { NextRequest, NextResponse } from 'next/server';

/**
 * 联网搜索考试大纲 API
 *
 * 使用阿里通义千问的联网搜索功能，获取最新的考试大纲和题型信息
 */

// 通义千问联网搜索需要使用原生 fetch，因为 OpenAI SDK 不支持 enable_search 参数
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { examType, examName } = await request.json();

    if (!examType || !examName) {
      return NextResponse.json(
        { error: '请提供考试类型和名称' },
        { status: 400 }
      );
    }

    // 构建搜索提示词
    const searchPrompt = buildSearchPrompt(examType, examName);

    // 调用通义千问 API，启用联网搜索
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
            content: `你是一个专业的考试备考助手。请根据用户的考试需求，联网搜索最新的考试大纲、题型分布、重点知识点等信息。

请以 JSON 格式返回，包含以下字段：
{
  "examInfo": {
    "name": "考试全称",
    "officialWebsite": "官方网站",
    "examTime": "考试时间",
    "totalScore": "总分",
    "duration": "考试时长"
  },
  "syllabus": [
    {
      "chapter": "章节名称",
      "weight": "占比百分比",
      "keyPoints": ["重点1", "重点2"],
      "questionTypes": ["题型1", "题型2"]
    }
  ],
  "questionDistribution": {
    "选择题": "数量或分值",
    "填空题": "数量或分值",
    "解答题": "数量或分值"
  },
  "preparationTips": ["备考建议1", "备考建议2"],
  "recentChanges": "最近的考纲变化（如有）",
  "searchSources": ["信息来源1", "信息来源2"]
}`
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
function buildSearchPrompt(examType: string, examName: string): string {
  const examPrompts: Record<string, string> = {
    'postgraduate': `请联网搜索 ${examName} 考研的最新考试大纲和信息，包括：
1. 2025年最新考试大纲和变化
2. 各科目分值分布和题型
3. 重点章节和知识点
4. 历年真题考查重点
5. 备考建议和时间规划`,

    'cet4': `请联网搜索 大学英语四级(CET-4) 的最新考试信息，包括：
1. 最新考试大纲和题型改革
2. 各部分分值和时间分配
3. 听力、阅读、写作、翻译的考查重点
4. 词汇量要求和高频词汇
5. 提分技巧和备考策略`,

    'cet6': `请联网搜索 大学英语六级(CET-6) 的最新考试信息，包括：
1. 最新考试大纲
2. 与四级的难度差异
3. 各题型的评分标准
4. 高频考点和词汇
5. 高分备考策略`,

    'civilService': `请联网搜索 ${examName} 公务员考试的最新信息，包括：
1. 行测和申论的最新大纲
2. 各模块题量和分值
3. 考试时间和形式
4. 近年考查热点
5. 备考资料推荐`,

    'professional': `请联网搜索 ${examName} 职业资格考试的最新信息，包括：
1. 最新考试大纲
2. 考试科目和题型
3. 报考条件和时间
4. 通过率和难度分析
5. 备考建议`,

    'default': `请联网搜索 ${examName} 考试的最新信息，包括：
1. 考试大纲和范围
2. 题型分布和分值
3. 重点知识点
4. 备考建议
5. 相关学习资源`
  };

  return examPrompts[examType] || examPrompts['default'];
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
