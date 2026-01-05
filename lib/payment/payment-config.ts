/**
 * 统一的支付配置
 * 所有关于价格、货币的定义都在这里
 */

export type BillingCycle = "monthly" | "yearly";
export type PaymentMethod = "wechat" | "alipay";

/**
 * 定价表（唯一的价格定义来源）
 */
const PRICING_DATA = {
  CNY: {
    monthly: 29.9,
    yearly: 299,
  },
} as const;

/**
 * 导出定价表供前端显示
 */
export const PRICING_TABLE = PRICING_DATA;

/**
 * 根据支付方式获取定价信息
 */
export function getPricingByMethod(method: PaymentMethod) {
  return {
    currency: "CNY",
    monthly: PRICING_DATA.CNY.monthly,
    yearly: PRICING_DATA.CNY.yearly,
  };
}

/**
 * 根据货币类型和账单周期获取金额
 */
export function getAmountByCurrency(
  currency: string,
  billingCycle: BillingCycle
): number {
  const prices = PRICING_DATA[currency as keyof typeof PRICING_DATA];
  return prices ? prices[billingCycle] : 0;
}

/**
 * 定义会员天数
 */
export function getDaysByBillingCycle(billingCycle: BillingCycle): number {
  return billingCycle === "monthly" ? 30 : 365;
}

/**
 * 获取支付货币
 */
export function getPaymentCurrency(): string {
  return "CNY";
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

/**
 * 生成订单号
 */
export function generateOrderId(prefix: string = "PAY"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}
