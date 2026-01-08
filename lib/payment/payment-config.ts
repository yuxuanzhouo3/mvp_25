/**
 * 统一的支付配置
 * 所有关于价格、货币的定义都在这里
 */

export type BillingCycle = "monthly" | "yearly";
export type PaymentMethod = "wechat" | "alipay" | "stripe" | "paypal";
export type Currency = "CNY" | "USD";

/**
 * 定价表（唯一的价格定义来源）
 */
const PRICING_DATA = {
  CNY: {
    monthly: 29.9,
    yearly: 299,
    symbol: "¥",
  },
  USD: {
    monthly: 4.99,
    yearly: 49.99,
    symbol: "$",
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
  const isIntl = method === "stripe" || method === "paypal";
  const currency = isIntl ? "USD" : "CNY";
  return {
    currency,
    monthly: PRICING_DATA[currency].monthly,
    yearly: PRICING_DATA[currency].yearly,
    symbol: PRICING_DATA[currency].symbol,
  };
}

/**
 * 根据货币类型和账单周期获取金额
 */
export function getAmountByCurrency(
  currency: Currency,
  billingCycle: BillingCycle
): number {
  const prices = PRICING_DATA[currency];
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
export function getPaymentCurrency(isIntl: boolean = false): Currency {
  return isIntl ? "USD" : "CNY";
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: number, currency: Currency = "CNY"): string {
  const symbol = PRICING_DATA[currency].symbol;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * 生成订单号
 */
export function generateOrderId(prefix: string = "PAY"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}
