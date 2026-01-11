// 评估相关类型定义

export interface AssessmentDimension {
  id: string;
  name: string;
  description: string;
  score: number; // 1-10
}

export interface AssessmentResult {
  subjectName: string;
  dimensions: AssessmentDimension[];
  completedAt: string;
  strengths: AssessmentDimension[];  // score >= 7
  weaknesses: AssessmentDimension[]; // score <= 4
}

export interface QuizAnswer {
  questionId: string;
  dimensionId: string;
  isCorrect: boolean;
  timeSpent: number; // 秒
  userAnswer: number | number[] | string[];
}

export interface DimensionBreakdown {
  dimensionId: string;
  name: string;
  originalScore: number;
  quizAccuracy: number;
  questionsCount: number;
  correctCount: number;
  improvement: string;
}

export interface PassProbability {
  score: number;      // 0-100
  level: 'low' | 'medium' | 'high';
  factors: {
    positive: string[];
    negative: string[];
  };
}

export interface PerformanceAnalysis {
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

export interface TargetedQuestion {
  id: string;
  type: 'single' | 'multiple' | 'fill';
  content: string;
  options?: string[];
  correctAnswer: number | number[] | string[];
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  knowledgePoint: string;
  dimensionId: string;  // 关联的评估维度
  dimensionName: string;
  blanksCount?: number;
}

export interface TargetedQuizState {
  phase: 'analysis' | 'intro' | 'loading' | 'quiz' | 'results';
  assessmentData: AssessmentResult | null;
  questions: TargetedQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  startTime: string | null;
  analysis: PerformanceAnalysis | null;
}

// localStorage 键名常量
export const STORAGE_KEYS = {
  ASSESSMENT_DATA: 'targetedAssessmentData',
  QUIZ_PROGRESS: 'targetedQuizProgress',
  QUIZ_RESULTS: 'targetedQuizResults',
} as const;

// 辅助函数：分析评估结果，识别优势和劣势
export function analyzeAssessmentResult(
  subjectName: string,
  dimensions: { id: string; name: string; description: string }[],
  ratings: Record<string, number>
): AssessmentResult {
  const dimensionsWithScores: AssessmentDimension[] = dimensions.map(dim => ({
    ...dim,
    score: ratings[dim.id] || 0,
  }));

  const strengths = dimensionsWithScores
    .filter(d => d.score >= 7)
    .sort((a, b) => b.score - a.score);

  const weaknesses = dimensionsWithScores
    .filter(d => d.score <= 4)
    .sort((a, b) => a.score - b.score);

  return {
    subjectName,
    dimensions: dimensionsWithScores,
    completedAt: new Date().toISOString(),
    strengths,
    weaknesses,
  };
}

// 辅助函数：计算成绩等级
export function calculateGrade(accuracy: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (accuracy >= 95) return 'S';
  if (accuracy >= 85) return 'A';
  if (accuracy >= 70) return 'B';
  if (accuracy >= 60) return 'C';
  return 'D';
}

// 辅助函数：获取等级颜色
export function getGradeColor(grade: 'S' | 'A' | 'B' | 'C' | 'D'): string {
  const colors = {
    S: 'from-yellow-400 to-amber-500',
    A: 'from-green-400 to-emerald-500',
    B: 'from-blue-400 to-cyan-500',
    C: 'from-orange-400 to-amber-500',
    D: 'from-red-400 to-rose-500',
  };
  return colors[grade];
}

// 辅助函数：获取通过率等级描述
export function getPassLevelDescription(level: 'low' | 'medium' | 'high'): {
  text: string;
  color: string;
  bgColor: string;
} {
  const descriptions = {
    low: {
      text: '需要加强',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
    medium: {
      text: '有望通过',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    high: {
      text: '信心满满',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
  };
  return descriptions[level];
}
