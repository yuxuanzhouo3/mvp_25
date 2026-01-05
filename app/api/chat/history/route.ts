import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/cloudbase';

interface ChatHistoryRecord {
  userId: string;
  question: string;
  userAnswer: string;
  isCorrect: boolean;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatHistoryRecord = await request.json();
    const { userId, question, userAnswer, isCorrect } = body;

    // 参数验证
    if (!userId || !question || userAnswer === undefined || isCorrect === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 保存到 chat_history 集合
    const result = await db.collection('chat_history').add({
      userId,
      question,
      userAnswer,
      isCorrect,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      message: '练习记录保存成功'
    });
  } catch (error) {
    console.error('保存练习记录失败:', error);
    return NextResponse.json(
      { error: '保存失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取用户练习历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少 userId 参数' },
        { status: 400 }
      );
    }

    const result = await db
      .collection('chat_history')
      .where({ userId })
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('获取练习记录失败:', error);
    return NextResponse.json(
      { error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}
