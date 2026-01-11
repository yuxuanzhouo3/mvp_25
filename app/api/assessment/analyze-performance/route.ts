import { NextRequest, NextResponse } from 'next/server';

/**
 * 答题表现分析 API
 *
 * 分析用户的答题表现，并预测考试通过概率
 */

// 请求参数类型
interface QuizResult {
  dimensionId: string;
  dimensionName: string;
  correct: number;
  total: number;
  avgTime: number;
}

interface AssessmentScore {
  dimensionId: string;
  name: string;
  score: number;
}

interface RequestBody {
  subjectName: string;
  assessmentScores: AssessmentScore[];
  quizResults: QuizResult[];
  totalTime?: number;
}

// 响应类型
interface DimensionBreakdown {
  dimensionId: string;
  name: string;
  originalScore: number;
  quizAccuracy: number;
  questionsCount: number;
  correctCount: number;
  improvement: string;
}

interface PassProbability {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: {
    positive: string[];
    negative: string[];
  };
}

interface PerformanceAnalysis {
  overallAccuracy: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  avgTimePerQuestion: number;
  dimensionBreakdown: DimensionBreakdown[];
  passProbability: PassProbability;
  recommendations: string[];
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      subjectName,
      assessmentScores = [],
      quizResults = [],
      totalTime = 0
    } = body;

    if (!subjectName) {
      return NextResponse.json(
        { error: '请提供科目名称' },
        { status: 400 }
      );
    }

    if (quizResults.length === 0) {
      return NextResponse.json(
        { error: '请提供答题结果' },
        { status: 400 }
      );
    }

    // 计算整体统计
    const totalQuestions = quizResults.reduce((sum, r) => sum + r.total, 0);
    const correctCount = quizResults.reduce((sum, r) => sum + r.correct, 0);
    const wrongCount = totalQuestions - correctCount;
    const overallAccuracy = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    // 计算平均用时
    const avgTimePerQuestion = totalTime > 0 && totalQuestions > 0
      ? Math.round(totalTime / totalQuestions)
      : Math.round(quizResults.reduce((sum, r) => sum + r.avgTime * r.total, 0) / totalQuestions);

    // 计算各维度表现
    const dimensionBreakdown: DimensionBreakdown[] = quizResults.map(result => {
      const originalAssessment = assessmentScores.find(a => a.dimensionId === result.dimensionId);
      const originalScore = originalAssessment?.score || 5;
      const quizAccuracy = result.total > 0
        ? Math.round((result.correct / result.total) * 100)
        : 0;

      // 计算进步情况
      const expectedAccuracy = originalScore * 10; // 原评分转换为预期正确率
      const diff = quizAccuracy - expectedAccuracy;
      let improvement = '';
      if (diff > 10) {
        improvement = `+${diff}% 超越预期`;
      } else if (diff > 0) {
        improvement = `+${diff}% 略有进步`;
      } else if (diff > -10) {
        improvement = `${diff}% 符合预期`;
      } else {
        improvement = `${diff}% 需要加强`;
      }

      return {
        dimensionId: result.dimensionId,
        name: result.dimensionName,
        originalScore,
        quizAccuracy,
        questionsCount: result.total,
        correctCount: result.correct,
        improvement
      };
    });

    // 计算通过概率
    const passProbability = calculatePassProbability(
      assessmentScores,
      quizResults,
      overallAccuracy,
      avgTimePerQuestion
    );

    // 生成学习建议
    const recommendations = generateRecommendations(
      dimensionBreakdown,
      overallAccuracy,
      avgTimePerQuestion
    );

    // 计算等级
    const grade = calculateGrade(overallAccuracy);

    const analysis: PerformanceAnalysis = {
      overallAccuracy,
      totalQuestions,
      correctCount,
      wrongCount,
      avgTimePerQuestion,
      dimensionBreakdown,
      passProbability,
      recommendations,
      grade
    };

    return NextResponse.json({
      success: true,
      subjectName,
      analysis
    });

  } catch (error) {
    console.error('分析答题表现失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 计算通过概率
 */
function calculatePassProbability(
  assessmentScores: AssessmentScore[],
  quizResults: QuizResult[],
  overallAccuracy: number,
  avgTime: number
): PassProbability {
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];

  // 1. 基础分 - 从原始评估计算（权重50%）
  const avgAssessmentScore = assessmentScores.length > 0
    ? assessmentScores.reduce((sum, a) => sum + a.score, 0) / assessmentScores.length
    : 5;
  const baseScore = avgAssessmentScore * 10; // 转换为0-100

  // 2. 答题表现调整（权重50%）
  const quizScore = overallAccuracy;

  // 3. 时间因子
  let timeFactor = 1.0;
  if (avgTime > 90) {
    timeFactor = 0.85;
    negativeFactors.push('答题速度较慢，需要提高解题效率');
  } else if (avgTime > 60) {
    timeFactor = 0.95;
  } else if (avgTime < 15) {
    timeFactor = 0.9; // 太快可能不认真
    negativeFactors.push('答题过快，建议仔细审题');
  } else {
    positiveFactors.push('答题速度适中，时间把控良好');
  }

  // 4. 分析各维度表现
  const weakDimensions = quizResults.filter(r => {
    const accuracy = r.total > 0 ? (r.correct / r.total) * 100 : 0;
    return accuracy < 50;
  });

  const strongDimensions = quizResults.filter(r => {
    const accuracy = r.total > 0 ? (r.correct / r.total) * 100 : 0;
    return accuracy >= 80;
  });

  if (strongDimensions.length > 0) {
    positiveFactors.push(`${strongDimensions.map(d => d.dimensionName).slice(0, 2).join('、')}表现优秀`);
  }

  if (weakDimensions.length > 0) {
    negativeFactors.push(`${weakDimensions.map(d => d.dimensionName).slice(0, 2).join('、')}需要重点加强`);
  }

  // 5. 计算最终通过率
  const rawScore = baseScore * 0.4 + quizScore * 0.6;
  let finalScore = Math.round(rawScore * timeFactor);

  // 边界处理
  finalScore = Math.max(10, Math.min(95, finalScore));

  // 根据答题正确率微调
  if (overallAccuracy >= 90) {
    finalScore = Math.min(95, finalScore + 10);
    positiveFactors.push('本次练习正确率极高');
  } else if (overallAccuracy >= 75) {
    finalScore = Math.min(90, finalScore + 5);
    positiveFactors.push('本次练习表现良好');
  } else if (overallAccuracy < 50) {
    finalScore = Math.max(15, finalScore - 10);
    negativeFactors.push('本次练习正确率较低，建议多加练习');
  }

  // 判断等级
  let level: 'low' | 'medium' | 'high';
  if (finalScore >= 70) {
    level = 'high';
  } else if (finalScore >= 50) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    score: finalScore,
    level,
    factors: {
      positive: positiveFactors,
      negative: negativeFactors
    }
  };
}

/**
 * 生成学习建议
 */
function generateRecommendations(
  dimensionBreakdown: DimensionBreakdown[],
  overallAccuracy: number,
  avgTime: number
): string[] {
  const recommendations: string[] = [];

  // 找出表现最差的维度
  const sortedByAccuracy = [...dimensionBreakdown].sort((a, b) => a.quizAccuracy - b.quizAccuracy);
  const worstDimensions = sortedByAccuracy.slice(0, 2);

  if (worstDimensions.length > 0 && worstDimensions[0].quizAccuracy < 60) {
    recommendations.push(
      `建议重点复习「${worstDimensions[0].name}」，可以从基础概念入手，逐步深入`
    );
  }

  if (worstDimensions.length > 1 && worstDimensions[1].quizAccuracy < 60) {
    recommendations.push(
      `「${worstDimensions[1].name}」也需要加强，建议多做相关练习题`
    );
  }

  // 根据整体表现给建议
  if (overallAccuracy >= 80) {
    recommendations.push('整体基础扎实，建议挑战更高难度的题目来突破瓶颈');
  } else if (overallAccuracy >= 60) {
    recommendations.push('基础掌握不错，建议针对薄弱点进行专项突破');
  } else {
    recommendations.push('建议从基础知识开始系统复习，打好根基后再做提升练习');
  }

  // 根据答题速度给建议
  if (avgTime > 60) {
    recommendations.push('答题速度偏慢，建议限时练习以提高解题效率');
  }

  // 找出进步最大的维度（正向激励）
  const improved = dimensionBreakdown.filter(d => d.improvement.includes('+'));
  if (improved.length > 0) {
    const bestImproved = improved.sort((a, b) => {
      const aVal = parseInt(a.improvement.match(/\d+/)?.[0] || '0');
      const bVal = parseInt(b.improvement.match(/\d+/)?.[0] || '0');
      return bVal - aVal;
    })[0];
    recommendations.push(`「${bestImproved.name}」进步明显，继续保持这个学习势头！`);
  }

  return recommendations.slice(0, 4); // 最多返回4条建议
}

/**
 * 计算等级
 */
function calculateGrade(accuracy: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (accuracy >= 95) return 'S';
  if (accuracy >= 85) return 'A';
  if (accuracy >= 70) return 'B';
  if (accuracy >= 60) return 'C';
  return 'D';
}

/**
 * GET 请求 - 返回 API 信息
 */
export async function GET() {
  return NextResponse.json({
    name: '答题表现分析 API',
    description: '分析用户的答题表现，并预测考试通过概率',
    parameters: {
      subjectName: '科目名称（必填）',
      assessmentScores: '原始评估分数数组',
      quizResults: '答题结果数组（必填）',
      totalTime: '总用时（秒，可选）'
    },
    returns: {
      overallAccuracy: '整体正确率',
      dimensionBreakdown: '各维度表现分析',
      passProbability: '通过概率预测',
      recommendations: '学习建议',
      grade: '评级（S/A/B/C/D）'
    }
  });
}
