// 科目评测维度映射表

export interface SubjectDimension {
  id: string;
  name: string;
  description: string;
}

export interface SubjectConfig {
  id: string;
  name: string;
  keywords: string[];  // 用于模糊匹配
  dimensions: SubjectDimension[];
}

export const SUBJECT_DIMENSIONS: SubjectConfig[] = [
  {
    id: 'kaoyan_math',
    name: '考研数学',
    keywords: ['考研数学', '考研高数', '数学一', '数学二', '数学三', '高数'],
    dimensions: [
      { id: 'calculus', name: '高等数学', description: '极限、导数、积分、微分方程' },
      { id: 'linear_algebra', name: '线性代数', description: '矩阵、行列式、向量空间' },
      { id: 'probability', name: '概率论与数理统计', description: '随机变量、分布、假设检验' },
      { id: 'series', name: '级数与空间解析', description: '无穷级数、空间曲线与曲面' },
      { id: 'multi_integral', name: '多元函数微积分', description: '偏导数、重积分、曲线曲面积分' },
      { id: 'diff_equation', name: '常微分方程', description: '一阶方程、高阶方程、应用题' },
      { id: 'proof', name: '证明题技巧', description: '中值定理、不等式证明' },
      { id: 'calculation', name: '计算能力', description: '复杂计算、化简技巧' },
      { id: 'speed', name: '解题速度', description: '限时解题能力' },
      { id: 'exam_strategy', name: '应试技巧', description: '时间分配、答题策略' },
    ],
  },
  {
    id: 'kaoyan_english',
    name: '考研英语',
    keywords: ['考研英语', '英语一', '英语二'],
    dimensions: [
      { id: 'reading', name: '阅读理解', description: '长篇阅读、信息筛选' },
      { id: 'translation', name: '翻译能力', description: '英译汉、长难句分析' },
      { id: 'writing', name: '写作水平', description: '大小作文、图表描述' },
      { id: 'vocabulary', name: '词汇量', description: '核心词汇掌握程度' },
      { id: 'grammar', name: '语法基础', description: '句法结构、从句分析' },
      { id: 'cloze', name: '完形填空', description: '逻辑推理、词义辨析' },
      { id: 'new_question', name: '新题型', description: '排序、匹配、小标题' },
      { id: 'long_sentence', name: '长难句分析', description: '复杂句拆解、结构分析' },
      { id: 'speed', name: '阅读速度', description: '限时阅读效率' },
      { id: 'exam_strategy', name: '应试技巧', description: '答题顺序、时间分配' },
    ],
  },
  {
    id: 'kaoyan_politics',
    name: '考研政治',
    keywords: ['考研政治', '政治', '马原', '毛中特'],
    dimensions: [
      { id: 'marxism', name: '马克思主义原理', description: '唯物辩证法、政治经济学' },
      { id: 'mzd', name: '毛中特', description: '毛泽东思想和中国特色社会主义' },
      { id: 'history', name: '近代史纲要', description: '中国近现代史' },
      { id: 'ethics', name: '思修法基', description: '思想道德修养与法律基础' },
      { id: 'current_affairs', name: '时事政治', description: '年度热点、重大会议' },
      { id: 'philosophy', name: '哲学原理', description: '认识论、唯物史观' },
      { id: 'economics', name: '政治经济学', description: '剩余价值、资本运动' },
      { id: 'analysis', name: '材料分析', description: '分析题答题技巧' },
      { id: 'memory', name: '记忆能力', description: '知识点背诵与理解' },
      { id: 'exam_strategy', name: '应试技巧', description: '选择题技巧、大题模板' },
    ],
  },
  {
    id: 'cet4',
    name: '大学英语四级',
    keywords: ['四级', 'CET4', 'CET-4', '英语四级', '大学英语四级'],
    dimensions: [
      { id: 'listening', name: '听力理解', description: '短对话、长对话、篇章听力' },
      { id: 'reading', name: '阅读理解', description: '选词填空、匹配、深度阅读' },
      { id: 'translation', name: '翻译能力', description: '汉译英段落翻译' },
      { id: 'writing', name: '写作表达', description: '议论文、说明文写作' },
      { id: 'vocabulary', name: '词汇量', description: '四级核心词汇掌握' },
      { id: 'grammar', name: '语法基础', description: '基础语法、句型结构' },
      { id: 'listening_note', name: '听力笔记', description: '边听边记、信息提取' },
      { id: 'reading_speed', name: '阅读速度', description: '快速阅读、信息定位' },
      { id: 'sentence_structure', name: '句型应用', description: '写作常用句型' },
      { id: 'exam_strategy', name: '应试技巧', description: '时间分配、答题顺序' },
    ],
  },
  {
    id: 'cet6',
    name: '大学英语六级',
    keywords: ['六级', 'CET6', 'CET-6', '英语六级', '大学英语六级'],
    dimensions: [
      { id: 'listening', name: '听力理解', description: '高级听力理解与推理' },
      { id: 'reading', name: '阅读理解', description: '学术文章、复杂篇章' },
      { id: 'translation', name: '翻译能力', description: '文化类段落翻译' },
      { id: 'writing', name: '写作表达', description: '高级议论文写作' },
      { id: 'vocabulary', name: '词汇量', description: '六级核心及高频词汇' },
      { id: 'grammar', name: '高级语法', description: '复杂句式、虚拟语气' },
      { id: 'inference', name: '推理判断', description: '听力与阅读中的推断能力' },
      { id: 'paraphrase', name: '同义转换', description: '词汇替换、句子改写' },
      { id: 'academic_writing', name: '学术写作', description: '正式文体、逻辑论证' },
      { id: 'exam_strategy', name: '应试技巧', description: '难题取舍、时间管理' },
    ],
  },
  {
    id: 'computer_exam',
    name: '计算机考试',
    keywords: ['计算机', '408', '软考', '计算机二级', 'NCRE', '计算机考试'],
    dimensions: [
      { id: 'data_structure', name: '数据结构', description: '链表、树、图、排序算法' },
      { id: 'os', name: '操作系统', description: '进程管理、内存管理、文件系统' },
      { id: 'network', name: '计算机网络', description: 'TCP/IP、HTTP、网络协议' },
      { id: 'database', name: '数据库', description: 'SQL、范式、事务' },
      { id: 'algorithm', name: '算法设计', description: '动态规划、贪心、回溯、分治' },
      { id: 'computer_org', name: '计算机组成原理', description: 'CPU、存储系统、指令集' },
      { id: 'programming', name: '编程语言', description: 'C/C++、Python语法与编程能力' },
      { id: 'software_eng', name: '软件工程', description: '开发流程、测试、设计模式' },
      { id: 'discrete_math', name: '离散数学', description: '图论、逻辑、集合论' },
      { id: 'exam_strategy', name: '应试技巧', description: '时间管理、答题策略、审题能力' },
    ],
  },
  {
    id: 'civil_service',
    name: '公务员考试',
    keywords: ['公务员', '国考', '省考', '行测', '申论'],
    dimensions: [
      { id: 'verbal', name: '言语理解', description: '阅读理解、逻辑填空' },
      { id: 'logic', name: '判断推理', description: '图形推理、逻辑判断' },
      { id: 'math', name: '数量关系', description: '数学运算、数字推理' },
      { id: 'essay', name: '申论写作', description: '概括归纳、综合分析、对策建议' },
      { id: 'data_analysis', name: '资料分析', description: '图表分析、数据计算' },
      { id: 'common_sense', name: '常识判断', description: '政治、经济、法律、科技' },
      { id: 'definition', name: '定义判断', description: '概念理解、逻辑归类' },
      { id: 'analogy', name: '类比推理', description: '词语关系、逻辑类比' },
      { id: 'essay_structure', name: '申论结构', description: '文章框架、论点论据' },
      { id: 'exam_strategy', name: '应试技巧', description: '答题顺序、时间分配' },
    ],
  },
  {
    id: 'toefl',
    name: '托福',
    keywords: ['托福', 'TOEFL', 'toefl'],
    dimensions: [
      { id: 'reading', name: '阅读', description: '学术文章阅读理解' },
      { id: 'listening', name: '听力', description: '讲座和对话理解' },
      { id: 'speaking', name: '口语', description: '独立和综合口语任务' },
      { id: 'writing', name: '写作', description: '综合写作和独立写作' },
      { id: 'vocabulary', name: '学术词汇', description: '托福核心学术词汇' },
      { id: 'note_taking', name: '笔记能力', description: '听力与综合任务笔记' },
      { id: 'inference', name: '推理能力', description: '阅读与听力中的推断' },
      { id: 'fluency', name: '口语流利度', description: '表达流畅性与发音' },
      { id: 'organization', name: '写作结构', description: '文章组织与逻辑' },
      { id: 'exam_strategy', name: '应试技巧', description: '时间管理、答题策略' },
    ],
  },
  {
    id: 'ielts',
    name: '雅思',
    keywords: ['雅思', 'IELTS', 'ielts'],
    dimensions: [
      { id: 'reading', name: '阅读', description: '学术类阅读理解' },
      { id: 'listening', name: '听力', description: '日常和学术场景听力' },
      { id: 'speaking', name: '口语', description: '面试口语表达' },
      { id: 'writing', name: '写作', description: '图表描述和议论文' },
      { id: 'vocabulary', name: '词汇广度', description: '雅思高频及学术词汇' },
      { id: 'grammar_accuracy', name: '语法准确性', description: '口语写作中的语法' },
      { id: 'task_response', name: '任务回应', description: '写作任务完成度' },
      { id: 'coherence', name: '连贯性', description: '口语写作逻辑连贯' },
      { id: 'pronunciation', name: '发音', description: '口语发音与语调' },
      { id: 'exam_strategy', name: '应试技巧', description: '时间管理、题型策略' },
    ],
  },
  {
    id: 'teacher_cert',
    name: '教师资格证',
    keywords: ['教师资格证', '教资', '教师证'],
    dimensions: [
      { id: 'knowledge', name: '综合素质', description: '职业理念、法律法规、文化素养' },
      { id: 'pedagogy', name: '教育知识', description: '教育学、心理学基础' },
      { id: 'subject', name: '学科知识', description: '专业学科知识与教学能力' },
      { id: 'interview', name: '面试技巧', description: '试讲、答辩、结构化面试' },
      { id: 'lesson_plan', name: '教案设计', description: '教学目标、教学过程设计' },
      { id: 'class_management', name: '班级管理', description: '学生管理、课堂纪律' },
      { id: 'teaching_method', name: '教学方法', description: '教学策略、教学手段' },
      { id: 'psychology', name: '教育心理学', description: '学习心理、发展心理' },
      { id: 'expression', name: '语言表达', description: '口头表达、板书设计' },
      { id: 'exam_strategy', name: '应试技巧', description: '笔试与面试策略' },
    ],
  },
  {
    id: 'cpa',
    name: '注册会计师',
    keywords: ['注册会计师', 'CPA', '注会'],
    dimensions: [
      { id: 'accounting', name: '会计', description: '财务会计、成本会计' },
      { id: 'audit', name: '审计', description: '审计理论与实务' },
      { id: 'tax', name: '税法', description: '税收法规与税务筹划' },
      { id: 'finance', name: '财务管理', description: '财务分析、投资决策' },
      { id: 'economic_law', name: '经济法', description: '合同法、公司法、证券法' },
      { id: 'strategy', name: '战略与风险', description: '公司战略、风险管理' },
      { id: 'calculation', name: '计算能力', description: '复杂财务计算' },
      { id: 'case_analysis', name: '案例分析', description: '综合案例分析能力' },
      { id: 'memory', name: '记忆能力', description: '法规条文记忆' },
      { id: 'exam_strategy', name: '应试技巧', description: '科目搭配、时间规划' },
    ],
  },
  {
    id: 'gre',
    name: 'GRE',
    keywords: ['GRE', 'gre', 'Graduate Record Examination'],
    dimensions: [
      { id: 'verbal', name: 'Verbal Reasoning', description: 'Reading comprehension, text completion, sentence equivalence' },
      { id: 'quant', name: 'Quantitative Reasoning', description: 'Arithmetic, algebra, geometry, data analysis' },
      { id: 'writing', name: 'Analytical Writing', description: 'Critical thinking and analytical writing skills' },
      { id: 'vocabulary', name: 'Vocabulary', description: 'Advanced academic vocabulary' },
      { id: 'reading_speed', name: 'Reading Speed', description: 'Efficient reading comprehension' },
      { id: 'math_concepts', name: 'Math Concepts', description: 'Core mathematical concepts and problem-solving' },
      { id: 'logic', name: 'Logical Reasoning', description: 'Argument analysis and evaluation' },
      { id: 'data_interpretation', name: 'Data Interpretation', description: 'Charts, graphs, and data analysis' },
      { id: 'essay_structure', name: 'Essay Structure', description: 'Organizing and developing arguments' },
      { id: 'exam_strategy', name: 'Test Strategy', description: 'Time management and question prioritization' },
    ],
  },
  {
    id: 'gmat',
    name: 'GMAT',
    keywords: ['GMAT', 'gmat', 'Graduate Management Admission Test'],
    dimensions: [
      { id: 'quant', name: 'Quantitative', description: 'Problem solving and data sufficiency' },
      { id: 'verbal', name: 'Verbal', description: 'Reading comprehension, critical reasoning, sentence correction' },
      { id: 'writing', name: 'Analytical Writing', description: 'Analysis of an argument' },
      { id: 'reasoning', name: 'Integrated Reasoning', description: 'Multi-source reasoning, graphics interpretation' },
      { id: 'critical_thinking', name: 'Critical Thinking', description: 'Evaluating arguments and assumptions' },
      { id: 'data_analysis', name: 'Data Analysis', description: 'Interpreting tables, graphs, and data' },
      { id: 'sentence_correction', name: 'Sentence Correction', description: 'Grammar and effective expression' },
      { id: 'problem_solving', name: 'Problem Solving', description: 'Mathematical problem-solving skills' },
      { id: 'reading_comprehension', name: 'Reading Comprehension', description: 'Understanding complex passages' },
      { id: 'exam_strategy', name: 'Test Strategy', description: 'Adaptive test strategy and pacing' },
    ],
  },
  {
    id: 'sat',
    name: 'SAT',
    keywords: ['SAT', 'sat', 'Scholastic Assessment Test'],
    dimensions: [
      { id: 'reading', name: 'Reading', description: 'Evidence-based reading' },
      { id: 'writing', name: 'Writing and Language', description: 'Grammar and rhetoric' },
      { id: 'math', name: 'Math', description: 'Problem solving and data analysis' },
      { id: 'vocabulary', name: 'Vocabulary in Context', description: 'Word meaning in passages' },
      { id: 'grammar', name: 'Grammar', description: 'Standard English conventions' },
      { id: 'algebra', name: 'Algebra', description: 'Linear equations and systems' },
      { id: 'advanced_math', name: 'Advanced Math', description: 'Complex equations and functions' },
      { id: 'data_analysis', name: 'Data Analysis', description: 'Statistics and probability' },
      { id: 'essay', name: 'Essay (Optional)', description: 'Analytical essay writing' },
      { id: 'exam_strategy', name: 'Test Strategy', description: 'Time management and question approach' },
    ],
  },
  {
    id: 'act',
    name: 'ACT',
    keywords: ['ACT', 'act', 'American College Testing'],
    dimensions: [
      { id: 'english', name: 'English', description: 'Grammar, punctuation, sentence structure' },
      { id: 'math', name: 'Mathematics', description: 'Algebra, geometry, trigonometry' },
      { id: 'reading', name: 'Reading', description: 'Reading comprehension' },
      { id: 'science', name: 'Science', description: 'Scientific reasoning' },
      { id: 'grammar', name: 'Grammar and Usage', description: 'Standard English conventions' },
      { id: 'rhetoric', name: 'Rhetorical Skills', description: 'Writing strategy and organization' },
      { id: 'algebra', name: 'Algebra', description: 'Algebraic concepts and equations' },
      { id: 'geometry', name: 'Geometry', description: 'Geometric concepts and proofs' },
      { id: 'data_interpretation', name: 'Data Interpretation', description: 'Charts, graphs, and scientific data' },
      { id: 'exam_strategy', name: 'Test Strategy', description: 'Pacing and question prioritization' },
    ],
  },
];

// 默认维度（当无法匹配时使用）- 也扩展到10个
export const DEFAULT_DIMENSIONS: SubjectDimension[] = [
  { id: 'basic', name: '基础知识', description: '核心概念掌握程度' },
  { id: 'application', name: '应用能力', description: '知识运用与解题能力' },
  { id: 'analysis', name: '分析能力', description: '问题分析与逻辑推理' },
  { id: 'comprehension', name: '理解能力', description: '材料理解与信息提取' },
  { id: 'memory', name: '记忆能力', description: '知识点记忆与回顾' },
  { id: 'calculation', name: '计算能力', description: '数值计算与推导' },
  { id: 'expression', name: '表达能力', description: '书面表达与阐述' },
  { id: 'reasoning', name: '推理能力', description: '逻辑推理与判断' },
  { id: 'speed', name: '答题速度', description: '限时解题效率' },
  { id: 'exam_strategy', name: '应试技巧', description: '时间管理、答题策略' },
];

/**
 * 根据科目名称匹配评测维度
 */
export function getSubjectDimensions(subjectName: string): SubjectDimension[] {
  const lowerName = subjectName.toLowerCase().trim();

  for (const subject of SUBJECT_DIMENSIONS) {
    for (const keyword of subject.keywords) {
      if (lowerName.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(lowerName)) {
        return subject.dimensions;
      }
    }
  }

  return DEFAULT_DIMENSIONS;
}

/**
 * 获取匹配的科目配置
 */
export function getSubjectConfig(subjectName: string): SubjectConfig | null {
  const lowerName = subjectName.toLowerCase().trim();

  for (const subject of SUBJECT_DIMENSIONS) {
    for (const keyword of subject.keywords) {
      if (lowerName.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(lowerName)) {
        return subject;
      }
    }
  }

  return null;
}

/**
 * 获取所有可用的科目列表（用于快捷选择）
 */
export function getAllSubjects(): { id: string; name: string }[] {
  return SUBJECT_DIMENSIONS.map(s => ({ id: s.id, name: s.name }));
}
