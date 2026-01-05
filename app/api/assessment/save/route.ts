import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/cloudbase';

interface AssessmentData {
  userId: string;
  skills: Record<string, Record<string, number>>;
  role: string;
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssessmentData = await request.json();
    const { userId, skills, role, score } = body;

    // 参数验证
    if (!userId || !skills || !role || score === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 保存到数据库
    const result = await db.collection('assessments').add({
      userId,
      skills,
      role,
      score,
      subject: 'Computer Science',
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      message: '评估结果保存成功'
    });
  } catch (error) {
    console.error('保存评估结果失败:', error);
    return NextResponse.json(
      { error: '保存失败，请稍后重试' },
      { status: 500 }
    );
  }
}
