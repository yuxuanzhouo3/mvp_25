/**
 * 区域配置中心
 * 根据 NEXT_PUBLIC_DEPLOYMENT_REGION 环境变量决定使用国内版还是国际版
 */

type DeploymentRegion = "CN" | "INTL";

const DEPLOYMENT_REGION: DeploymentRegion =
  process.env.NEXT_PUBLIC_DEPLOYMENT_REGION === "INTL" ? "INTL" : "CN";

export const RegionConfig = {
  region: DEPLOYMENT_REGION,

  // 认证配置
  auth: {
    provider: DEPLOYMENT_REGION === "CN" ? "cloudbase" : "supabase",
    features: {
      emailAuth: true, // 两个区域都支持邮箱认证
      wechatAuth: DEPLOYMENT_REGION === "CN", // 仅国内版支持微信登录
      googleAuth: DEPLOYMENT_REGION === "INTL", // 仅国际版支持 Google OAuth
      githubAuth: DEPLOYMENT_REGION === "INTL", // 仅国际版支持 GitHub OAuth
    },
  },

  // 支付配置
  payment: {
    provider: DEPLOYMENT_REGION === "CN" ? "wechat_alipay" : "stripe_paypal",
    methods: DEPLOYMENT_REGION === "CN"
      ? ["wechat", "alipay"]
      : ["stripe", "paypal"],
    currency: DEPLOYMENT_REGION === "CN" ? "CNY" : "USD",
  },

  // 数据库配置
  database: {
    provider: DEPLOYMENT_REGION === "CN" ? "cloudbase" : "supabase",
  },
};

// 工具函数
export function isChinaRegion(): boolean {
  return DEPLOYMENT_REGION === "CN";
}

export function isInternationalRegion(): boolean {
  return DEPLOYMENT_REGION === "INTL";
}

export function getRegion(): DeploymentRegion {
  return DEPLOYMENT_REGION;
}
