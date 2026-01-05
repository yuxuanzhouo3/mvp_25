/**
 * 测试 API 端点
 * 访问 /api/exam/test-document-api 来测试文档出题 API
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 测试文档内容
    const testContent = `
考研数学测试题库

第一章：高等数学

1. 极限的定义
极限是微积分的基础概念。当自变量x无限接近某个值时，函数f(x)无限接近的值称为极限。

2. 导数的概念
导数表示函数在某一点的变化率。几何意义是曲线在该点的切线斜率。

3. 积分的应用
定积分可以用来计算面积、体积等几何量。
    `.trim();

    // 调用文档出题 API
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/exam/generate-from-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentContent: testContent,
        examName: '测试考试',
        count: 5
      })
    });

    const data = await response.json();

    return NextResponse.json({
      testStatus: 'completed',
      apiResponse: data,
      apiStatus: response.status,
      apiOk: response.ok,
      envCheck: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        hasModelName: !!process.env.AI_MODEL_NAME,
        apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
      }
    });

  } catch (error) {
    return NextResponse.json({
      testStatus: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
