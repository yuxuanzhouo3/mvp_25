// 智能备考系统 - 模拟数据和工具函数

// ============ 类型定义 ============

// 题目类型
export type QuestionType = 'single' | 'multiple' | 'fill';

export interface Question {
  id: string;
  type?: QuestionType; // 题目类型：单选、多选、填空，默认为单选
  content: string;
  options?: string[]; // 选择题选项（填空题无此字段）
  correctAnswer: number | number[] | string[]; // 单选: number, 多选: number[], 填空: string[]
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  knowledgePoint: string;
  category?: string;
  blanksCount?: number; // 填空题的空数量
}

export interface UserRankState {
  rank: RankType;
  points: number;
  currentCombo: number;
  maxCombo: number;
  consecutiveWrong: number;
  todayCorrect: number;
  todayWrong: number;
}

export interface WrongQuestion {
  questionId: string;
  question: Question;
  wrongCount: number;
  lastWrongAt: Date;
  mastered: boolean;
  userAnswers: (number | number[] | string[])[]; // 支持不同题型的答案记录
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: number | number[] | string[]; // 支持不同题型的答案
  isCorrect: boolean;
  timeSpent: number;
  timestamp: number;
  partialScore?: number; // 填空题部分得分（0-1）
}

export type RankType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// ============ 等级配置 ============

export const RANK_CONFIG: Record<RankType, {
  name: string;
  min: number;
  max: number;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  bronze: {
    name: '青铜',
    min: 0,
    max: 199,
    icon: '🥉',
    color: 'from-amber-700 to-amber-900',
    bgColor: 'bg-amber-900/30'
  },
  silver: {
    name: '白银',
    min: 200,
    max: 499,
    icon: '🥈',
    color: 'from-slate-300 to-slate-500',
    bgColor: 'bg-slate-500/30'
  },
  gold: {
    name: '黄金',
    min: 500,
    max: 999,
    icon: '🥇',
    color: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-600/30'
  },
  platinum: {
    name: '铂金',
    min: 1000,
    max: 1999,
    icon: '💎',
    color: 'from-cyan-300 to-cyan-500',
    bgColor: 'bg-cyan-500/30'
  },
  diamond: {
    name: '钻石',
    min: 2000,
    max: 99999,
    icon: '👑',
    color: 'from-blue-400 to-purple-500',
    bgColor: 'bg-purple-500/30'
  }
};

// 等级顺序（用于升降级判断）
export const RANK_ORDER: RankType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

// ============ 积分规则 ============

export const POINT_RULES = {
  // 答对基础分
  correctBase: 10,

  // 连击加成
  comboBonus: {
    3: 5,
    5: 10,
    10: 20,
    20: 50
  } as Record<number, number>,

  // 难度加成倍率
  difficultyMultiplier: {
    1: 1.0,
    2: 1.2,
    3: 1.5,
    4: 2.0,
    5: 3.0
  } as Record<number, number>,

  // 答错扣分
  wrongBase: -5,

  // 连续错误额外扣分
  consecutiveWrongPenalty: {
    3: -10,
    5: -20,
    7: -30
  } as Record<number, number>,

  // 降级警告阈值
  demotionWarningThresholds: {
    level1: 4,  // 连续4错 - 黄色警告
    level2: 6,  // 连续6错 - 橙色警告
    level3: 7   // 连续7错 - 降级
  }
};

// ============ 工具函数 ============

/**
 * 根据积分计算等级
 */
export function getRankByPoints(points: number): RankType {
  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    const rank = RANK_ORDER[i];
    if (points >= RANK_CONFIG[rank].min) {
      return rank;
    }
  }
  return 'bronze';
}

/**
 * 获取下一个等级
 */
export function getNextRank(currentRank: RankType): RankType | null {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex < RANK_ORDER.length - 1) {
    return RANK_ORDER[currentIndex + 1];
  }
  return null;
}

/**
 * 获取上一个等级
 */
export function getPrevRank(currentRank: RankType): RankType | null {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex > 0) {
    return RANK_ORDER[currentIndex - 1];
  }
  return null;
}

/**
 * 计算答题获得/失去的积分
 */
export function calculatePoints(
  isCorrect: boolean,
  combo: number,
  difficulty: number,
  consecutiveWrong: number,
  partialScore?: number // 填空题部分得分（0-1）
): number {
  if (isCorrect) {
    let points = POINT_RULES.correctBase;

    // 连击加成
    const comboBonusKeys = Object.keys(POINT_RULES.comboBonus)
      .map(Number)
      .sort((a, b) => b - a);
    for (const threshold of comboBonusKeys) {
      if (combo >= threshold) {
        points += POINT_RULES.comboBonus[threshold];
        break;
      }
    }

    // 难度加成
    const multiplier = POINT_RULES.difficultyMultiplier[difficulty] || 1;
    points = Math.floor(points * multiplier);

    return points;
  } else {
    // 填空题部分得分
    if (partialScore !== undefined && partialScore > 0 && partialScore < 1) {
      // 部分正确：给予部分基础分，不给连击加成
      let points = POINT_RULES.correctBase * partialScore;

      // 难度加成
      const multiplier = POINT_RULES.difficultyMultiplier[difficulty] || 1;
      points = Math.floor(points * multiplier);

      return points;
    }

    // 完全错误：扣分
    let points = POINT_RULES.wrongBase;

    // 连续错误额外扣分
    const penaltyKeys = Object.keys(POINT_RULES.consecutiveWrongPenalty)
      .map(Number)
      .sort((a, b) => b - a);
    for (const threshold of penaltyKeys) {
      if (consecutiveWrong >= threshold) {
        points += POINT_RULES.consecutiveWrongPenalty[threshold];
        break;
      }
    }

    return points;
  }
}

/**
 * 获取降级警告等级
 */
export function getDemotionWarningLevel(consecutiveWrong: number): 0 | 1 | 2 | 3 {
  const { level1, level2, level3 } = POINT_RULES.demotionWarningThresholds;

  if (consecutiveWrong >= level3) return 3;
  if (consecutiveWrong >= level2) return 2;
  if (consecutiveWrong >= level1) return 1;
  return 0;
}

/**
 * 乱答题检测
 */
export function detectCheat(recentAnswers: AnswerRecord[]): {
  detected: boolean;
  level: 0 | 1 | 2;
  pattern: 'too_fast' | 'low_accuracy' | 'same_option' | null;
  message: string;
} {
  if (recentAnswers.length < 5) {
    return { detected: false, level: 0, pattern: null, message: '' };
  }

  const recent = recentAnswers.slice(-5);

  // 检测1: 答题速度过快 (平均小于3秒)
  const avgTime = recent.reduce((sum, a) => sum + a.timeSpent, 0) / recent.length;
  if (avgTime < 3) {
    return {
      detected: true,
      level: 2,
      pattern: 'too_fast',
      message: '检测到答题速度异常快（平均少于3秒/题），请认真答题！'
    };
  }

  // 检测2: 正确率极低 (小于20%) + 速度快
  const accuracy = recent.filter(a => a.isCorrect).length / recent.length;
  if (avgTime < 5 && accuracy < 0.2) {
    return {
      detected: true,
      level: 2,
      pattern: 'low_accuracy',
      message: '检测到答题正确率异常低且速度快，疑似随机作答！'
    };
  }

  // 检测3: 连续选择相同选项
  const answers = recent.map(a => a.userAnswer);
  const allSame = answers.every(a => a === answers[0]);
  if (allSame) {
    return {
      detected: true,
      level: 1,
      pattern: 'same_option',
      message: '检测到连续选择相同选项，请仔细阅读题目！'
    };
  }

  return { detected: false, level: 0, pattern: null, message: '' };
}

/**
 * 计算升级所需积分
 */
export function getPointsToNextRank(currentPoints: number, currentRank: RankType): number {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) return 0;
  return RANK_CONFIG[nextRank].min - currentPoints;
}

/**
 * 计算当前等级进度百分比
 */
export function getRankProgress(points: number, rank: RankType): number {
  const config = RANK_CONFIG[rank];
  const nextRank = getNextRank(rank);

  if (!nextRank) return 100; // 已是最高等级

  const rangeStart = config.min;
  const rangeEnd = RANK_CONFIG[nextRank].min;
  const progress = ((points - rangeStart) / (rangeEnd - rangeStart)) * 100;

  return Math.min(100, Math.max(0, progress));
}

// ============ 模拟题库 ============

export const MOCK_QUESTIONS: Question[] = [
  // 高等数学 - 极值与导数
  {
    id: 'math_001',
    content: '设函数 f(x) = x³ - 3x，则 f(x) 的极小值为？',
    options: ['A. -2', 'B. 2', 'C. -4', 'D. 4'],
    correctAnswer: 0,
    explanation: '求导 f\'(x) = 3x² - 3 = 0，得 x = ±1。\n\n当 x = 1 时，f(1) = 1 - 3 = -2（极小值）\n当 x = -1 时，f(-1) = -1 + 3 = 2（极大值）\n\n因此极小值为 -2。',
    difficulty: 2,
    knowledgePoint: '极值与最值',
    category: '高等数学'
  },
  {
    id: 'math_002',
    content: '函数 y = e^x 在 x = 0 处的切线方程为？',
    options: ['A. y = x + 1', 'B. y = x', 'C. y = x - 1', 'D. y = 2x + 1'],
    correctAnswer: 0,
    explanation: 'y = e^x 的导数 y\' = e^x\n\n在 x = 0 处：\n- 切点坐标：(0, e^0) = (0, 1)\n- 斜率：e^0 = 1\n\n切线方程：y - 1 = 1(x - 0)，即 y = x + 1',
    difficulty: 2,
    knowledgePoint: '导数与切线',
    category: '高等数学'
  },
  {
    id: 'math_003',
    content: '∫(0到1) x²dx 的值为？',
    options: ['A. 1/3', 'B. 1/2', 'C. 1', 'D. 2/3'],
    correctAnswer: 0,
    explanation: '根据定积分公式：\n\n∫x²dx = x³/3 + C\n\n代入上下限：\n[x³/3]₀¹ = 1³/3 - 0³/3 = 1/3',
    difficulty: 1,
    knowledgePoint: '定积分计算',
    category: '高等数学'
  },
  {
    id: 'math_004',
    content: 'lim(x→0) (sin x)/x 的值为？',
    options: ['A. 1', 'B. 0', 'C. ∞', 'D. 不存在'],
    correctAnswer: 0,
    explanation: '这是一个重要极限公式：\n\nlim(x→0) (sin x)/x = 1\n\n可以用洛必达法则验证，或者用泰勒展开：\nsin x ≈ x - x³/6 + ...\n(sin x)/x ≈ 1 - x²/6 + ... → 1 (当 x→0)',
    difficulty: 1,
    knowledgePoint: '极限',
    category: '高等数学'
  },
  {
    id: 'math_005',
    content: '设 z = xy + x/y，求 ∂z/∂x？',
    options: ['A. y + 1/y', 'B. x + 1/y', 'C. y - x/y²', 'D. x - y'],
    correctAnswer: 0,
    explanation: '对 z = xy + x/y 求关于 x 的偏导数：\n\n∂z/∂x = ∂(xy)/∂x + ∂(x/y)/∂x\n       = y + 1/y\n\n（将 y 视为常数）',
    difficulty: 3,
    knowledgePoint: '偏导数',
    category: '高等数学'
  },
  // 线性代数
  {
    id: 'math_006',
    content: '矩阵 A = [[1,2],[3,4]] 的行列式值为？',
    options: ['A. -2', 'B. 2', 'C. -1', 'D. 10'],
    correctAnswer: 0,
    explanation: '对于 2×2 矩阵 [[a,b],[c,d]]，行列式 = ad - bc\n\n|A| = 1×4 - 2×3 = 4 - 6 = -2',
    difficulty: 1,
    knowledgePoint: '行列式',
    category: '线性代数'
  },
  {
    id: 'math_007',
    content: '若矩阵 A 的特征值为 1, 2, 3，则 |A| = ？',
    options: ['A. 6', 'B. 5', 'C. 3', 'D. 1'],
    correctAnswer: 0,
    explanation: '矩阵的行列式等于所有特征值的乘积：\n\n|A| = λ₁ × λ₂ × λ₃ = 1 × 2 × 3 = 6',
    difficulty: 2,
    knowledgePoint: '特征值',
    category: '线性代数'
  },
  {
    id: 'math_008',
    content: '下列哪个向量组线性相关？',
    options: [
      'A. (1,0,0), (0,1,0), (1,1,0)',
      'B. (1,0,0), (0,1,0), (0,0,1)',
      'C. (1,2), (3,4)',
      'D. (1,0), (0,1)'
    ],
    correctAnswer: 0,
    explanation: '选项 A 中，(1,1,0) = (1,0,0) + (0,1,0)\n\n即第三个向量可以由前两个线性表出，所以线性相关。\n\n其他选项的向量组都是线性无关的。',
    difficulty: 3,
    knowledgePoint: '线性相关性',
    category: '线性代数'
  },
  // 概率论
  {
    id: 'math_009',
    content: '设随机变量 X ~ N(0,1)，则 P(X ≤ 0) = ？',
    options: ['A. 0.5', 'B. 0', 'C. 1', 'D. 0.68'],
    correctAnswer: 0,
    explanation: '标准正态分布 N(0,1) 关于 x = 0 对称。\n\n因此 P(X ≤ 0) = 0.5\n\n这是标准正态分布的基本性质。',
    difficulty: 1,
    knowledgePoint: '正态分布',
    category: '概率论'
  },
  {
    id: 'math_010',
    content: '抛掷两枚均匀硬币，至少有一枚正面朝上的概率是？',
    options: ['A. 3/4', 'B. 1/2', 'C. 1/4', 'D. 1'],
    correctAnswer: 0,
    explanation: '样本空间：{正正, 正反, 反正, 反反}\n\n"至少一枚正面"的对立事件是"两枚都反面"\nP(都反面) = 1/4\n\nP(至少一枚正面) = 1 - 1/4 = 3/4',
    difficulty: 1,
    knowledgePoint: '古典概型',
    category: '概率论'
  },
  {
    id: 'math_011',
    content: '设 X 和 Y 独立，E(X) = 1, E(Y) = 2，则 E(XY) = ？',
    options: ['A. 2', 'B. 3', 'C. 1', 'D. 4'],
    correctAnswer: 0,
    explanation: '当 X 和 Y 独立时：\n\nE(XY) = E(X) × E(Y) = 1 × 2 = 2\n\n这是独立随机变量期望的重要性质。',
    difficulty: 2,
    knowledgePoint: '期望',
    category: '概率论'
  },
  {
    id: 'math_012',
    content: '设 X ~ B(10, 0.5)，则 E(X) = ？',
    options: ['A. 5', 'B. 10', 'C. 2.5', 'D. 0.5'],
    correctAnswer: 0,
    explanation: '二项分布 B(n, p) 的期望：\n\nE(X) = n × p = 10 × 0.5 = 5',
    difficulty: 1,
    knowledgePoint: '二项分布',
    category: '概率论'
  },
  // 数据结构与算法
  {
    id: 'cs_001',
    content: '快速排序的平均时间复杂度是？',
    options: ['A. O(n log n)', 'B. O(n²)', 'C. O(n)', 'D. O(log n)'],
    correctAnswer: 0,
    explanation: '快速排序：\n- 平均时间复杂度：O(n log n)\n- 最坏时间复杂度：O(n²)（当数组已排序时）\n- 空间复杂度：O(log n)（递归栈）\n\n快速排序是实践中最快的排序算法之一。',
    difficulty: 2,
    knowledgePoint: '排序算法',
    category: '数据结构'
  },
  {
    id: 'cs_002',
    content: '二叉搜索树中序遍历的结果是？',
    options: ['A. 有序序列', 'B. 无序序列', 'C. 逆序序列', 'D. 随机序列'],
    correctAnswer: 0,
    explanation: '二叉搜索树的性质：\n- 左子树所有节点 < 根节点\n- 右子树所有节点 > 根节点\n\n中序遍历顺序：左 → 根 → 右\n\n因此中序遍历结果是升序排列的有序序列。',
    difficulty: 2,
    knowledgePoint: '二叉树',
    category: '数据结构'
  },
  {
    id: 'cs_003',
    content: '哈希表查找的平均时间复杂度是？',
    options: ['A. O(1)', 'B. O(n)', 'C. O(log n)', 'D. O(n²)'],
    correctAnswer: 0,
    explanation: '哈希表通过哈希函数直接计算元素位置：\n- 平均时间复杂度：O(1)\n- 最坏时间复杂度：O(n)（所有元素冲突时）\n\n这是哈希表最大的优势。',
    difficulty: 1,
    knowledgePoint: '哈希表',
    category: '数据结构'
  },
  {
    id: 'cs_004',
    content: '栈的特点是？',
    options: ['A. 后进先出 (LIFO)', 'B. 先进先出 (FIFO)', 'C. 随机访问', 'D. 双端访问'],
    correctAnswer: 0,
    explanation: '栈（Stack）的特点：\n- 后进先出 (Last In First Out, LIFO)\n- 只能在栈顶进行插入和删除操作\n\n队列是先进先出 (FIFO)。',
    difficulty: 1,
    knowledgePoint: '栈与队列',
    category: '数据结构'
  },
  {
    id: 'cs_005',
    content: '图的深度优先搜索(DFS)使用什么数据结构？',
    options: ['A. 栈', 'B. 队列', 'C. 堆', 'D. 数组'],
    correctAnswer: 0,
    explanation: '图的遍历：\n- DFS（深度优先）：使用栈（或递归）\n- BFS（广度优先）：使用队列\n\nDFS 沿着一条路径走到底，然后回溯。',
    difficulty: 2,
    knowledgePoint: '图算法',
    category: '数据结构'
  },
  // 更多题目...
  {
    id: 'math_013',
    content: '函数 f(x) = |x| 在 x = 0 处？',
    options: ['A. 连续但不可导', 'B. 可导', 'C. 不连续', 'D. 可导且导数为0'],
    correctAnswer: 0,
    explanation: 'f(x) = |x| 在 x = 0 处：\n- 连续：lim(x→0) |x| = 0 = f(0) ✓\n- 不可导：左导数 = -1，右导数 = 1，不相等 ✗\n\n因此连续但不可导。',
    difficulty: 2,
    knowledgePoint: '连续与可导',
    category: '高等数学'
  },
  {
    id: 'math_014',
    content: '若 f(x) 在 [a,b] 上连续，则 ∫(a到b) f(x)dx 一定存在吗？',
    options: ['A. 一定存在', 'B. 不一定', 'C. 一定不存在', 'D. 取决于f(x)'],
    correctAnswer: 0,
    explanation: '这是定积分存在的充分条件之一：\n\n若 f(x) 在闭区间 [a,b] 上连续，则 f(x) 在 [a,b] 上可积。\n\n这是黎曼积分的基本定理。',
    difficulty: 2,
    knowledgePoint: '定积分',
    category: '高等数学'
  },
  {
    id: 'cs_006',
    content: '动态规划的核心思想是？',
    options: [
      'A. 将问题分解为重叠子问题，避免重复计算',
      'B. 贪心选择当前最优',
      'C. 分治后合并结果',
      'D. 穷举所有可能'
    ],
    correctAnswer: 0,
    explanation: '动态规划的核心特点：\n1. 最优子结构：问题的最优解包含子问题的最优解\n2. 重叠子问题：子问题会重复出现\n3. 记忆化：保存已计算的子问题结果，避免重复计算\n\n与分治的区别：分治的子问题不重叠。',
    difficulty: 3,
    knowledgePoint: '动态规划',
    category: '数据结构'
  }
];

// ============ 模拟 AI 回复 ============

export const MOCK_AI_RESPONSES: Record<string, string[]> = {
  '为什么': [
    '这是一个很好的问题！让我来详细解释一下...',
    '原因是这样的：首先我们需要理解基本概念...',
    '这个问题涉及到一个核心原理...'
  ],
  '怎么': [
    '要解决这类问题，通常有以下步骤：\n1. 首先分析题目条件\n2. 确定使用的方法\n3. 按步骤计算',
    '我来教你一个技巧：先把题目中的关键信息标记出来...',
    '这类题目的解法是固定的，记住这个公式就行...'
  ],
  '举例': [
    '好的，让我举一个生活中的例子来帮助理解...',
    '比如说，假设你有一个...',
    '让我用一个简单的例子说明：假设...'
  ],
  '还是不懂': [
    '没关系，让我换一种方式解释。想象一下...',
    '我理解你的困惑。让我们从最基础的地方开始...',
    '让我用更简单的话来说：其实就是...'
  ],
  'default': [
    '这个问题很有深度！让我来分析一下...',
    '你问到了一个重要的知识点。关于这个问题...',
    '很好的思考方向！让我详细解答...'
  ]
};

/**
 * 获取模拟的 AI 回复
 */
export function getMockAIResponse(question: string): string {
  const lowerQ = question.toLowerCase();

  for (const [keyword, responses] of Object.entries(MOCK_AI_RESPONSES)) {
    if (keyword !== 'default' && lowerQ.includes(keyword)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  return MOCK_AI_RESPONSES['default'][Math.floor(Math.random() * MOCK_AI_RESPONSES['default'].length)];
}

/**
 * 获取推荐的追问问题
 */
export function getSuggestedQuestions(question: Question): string[] {
  return [
    `能举个关于"${question.knowledgePoint}"的例子吗？`,
    '这个知识点考试常考吗？',
    '有没有类似的题目可以练习？',
    '我还是不太懂，能再解释一下吗？'
  ];
}

// ============ 考试类型预设 ============

export const EXAM_PRESETS = [
  { id: 'kaoyan_math', name: '考研数学', category: '研究生考试' },
  { id: 'kaoyan_english', name: '考研英语', category: '研究生考试' },
  { id: 'kaoyan_politics', name: '考研政治', category: '研究生考试' },
  { id: 'cet4', name: '大学英语四级', category: '英语考试' },
  { id: 'cet6', name: '大学英语六级', category: '英语考试' },
  { id: 'ncre', name: '计算机二级', category: '计算机考试' },
  { id: 'pmp', name: 'PMP项目管理', category: '职业认证' },
  { id: 'cpa', name: '注册会计师', category: '职业认证' },
  { id: 'other', name: '其他考试', category: '自定义' }
];

// ============ 初始用户状态 ============

export const INITIAL_RANK_STATE: UserRankState = {
  rank: 'bronze',
  points: 0,
  currentCombo: 0,
  maxCombo: 0,
  consecutiveWrong: 0,
  todayCorrect: 0,
  todayWrong: 0
};
