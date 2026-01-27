/**
 * CloudBase 数据库集合 Schema 定义
 */

/**
 * web_users 集合 - 用户表
 */
export interface WebUser {
  _id?: string;
  email: string;
  password: string; // bcryptjs 加密后的密码
  name: string;
  avatar?: string;
  phone?: string;

  // 微信登录信息
  wechat_openid?: string;
  wechat_unionid?: string;

  // 订阅信息
  pro: boolean;
  subscription_plan?: "free" | "pro" | "enterprise";
  subscription_status?: "active" | "paused" | "canceled" | "expired";
  subscription_expires_at?: string;
  membership_expires_at?: string;

  // 区域信息
  region: string;

  // 时间戳
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  last_login_ip?: string;
  login_count?: number;
}

/**
 * payments 集合 - 支付记录
 */
export interface Payment {
  _id?: string;
  user_id: string;
  email: string;
  amount: number;
  currency: string;
  method: "wechat" | "alipay";
  status: "pending" | "completed" | "failed" | "refunded";
  order_id: string;
  transaction_id?: string;
  product_type: "pro" | "tokens" | "subscription";
  product_name: string;
  billing_cycle?: "monthly" | "yearly";
  region: string;
  created_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

/**
 * subscriptions 集合 - 订阅记录
 */
export interface Subscription {
  _id?: string;
  user_id: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "paused" | "canceled" | "expired";
  start_date: string;
  end_date?: string;
  auto_renew: boolean;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  transaction_id?: string;
  region: string;
  created_at: string;
  updated_at: string;
}

/**
 * refresh_tokens 集合 - Refresh Token 管理
 */
export interface RefreshTokenRecord {
  _id?: string;
  tokenId: string;
  userId: string;
  email: string;
  refreshToken?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokeReason?: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
  usageCount: number;
  region: string;
}

/**
 * wrong_questions 集合 - 错题本
 */
export interface WrongQuestion {
  _id?: string;
  user_id: string;
  questionId: string;
  question: {
    id: string;
    type?: "single" | "multiple" | "fill";
    content: string;
    options?: string[];
    correctAnswer: number | number[] | string[];
    explanation: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    knowledgePoint: string;
    category?: string;
    blanksCount?: number;
  };
  wrongCount: number;
  lastWrongAt: string;
  mastered: boolean;
  userAnswers: (number | number[] | string[])[];
  created_at: string;
  updated_at: string;
}

/**
 * CloudBase 集合列表
 */
export const CLOUDBASE_COLLECTIONS = {
  WEB_USERS: "web_users",
  PAYMENTS: "payments",
  SUBSCRIPTIONS: "subscriptions",
  REFRESH_TOKENS: "refresh_tokens",
  ASSESSMENTS: "assessments",
  CHAT_HISTORY: "chat_history",
  WRONG_QUESTIONS: "wrong_questions",
} as const;
