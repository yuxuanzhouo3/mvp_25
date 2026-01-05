/**
 * 部署配置
 * 直接在代码中定义部署区域，避免环境变量在构建时的问题
 */

export type Region = "CN" | "INTL";

/**
 * 当前部署区域
 * 修改这个值来切换区域：
 * - "CN": 中国区（使用 CloudBase + 微信 + 支付宝）
 * - "INTL": 国际区（使用 Supabase + Google + PayPal）
 */
export const currentRegion: Region = "CN";

/**
 * 部署配置
 */
export const deploymentConfig = {
  region: currentRegion,

  // 服务提供商配置
  providers: {
    auth: currentRegion === "CN" ? "cloudbase" : "supabase",
    database: currentRegion === "CN" ? "cloudbase" : "supabase",
    payment: currentRegion === "CN" ? ["wechat", "alipay"] : ["stripe", "paypal"],
    ai: currentRegion === "CN" ? "deepseek" : "openai",
  },

  // 功能开关
  features: {
    wechatLogin: currentRegion === "CN",
    alipayPayment: currentRegion === "CN",
    wechatPayment: currentRegion === "CN",
    googleLogin: currentRegion === "INTL",
    stripePayment: currentRegion === "INTL",
  },
} as const;
