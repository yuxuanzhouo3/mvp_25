/**
 * 多币种格式化工具函数
 */

/**
 * 按指定币种格式化金额
 * @param amount - 金额数字
 * @param currency - 币种类型 (USD | CNY)
 * @returns 格式化后的货币字符串
 */
export function formatAmountWithCurrency(
  amount: number,
  currency: 'USD' | 'CNY' = 'CNY'
): string {
  const locale = currency === 'USD' ? 'en-US' : 'zh-CN';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * 同时显示美元和人民币
 * 返回格式: "$107.82 + ¥2917.88"
 * @param usd - 美元金额
 * @param cny - 人民币金额
 * @returns 双币种格式化字符串
 */
export function formatMultiCurrencyAmount(
  usd: number,
  cny: number
): string {
  const usdStr = formatAmountWithCurrency(usd, 'USD');
  const cnyStr = formatAmountWithCurrency(cny, 'CNY');
  return `${usdStr} + ${cnyStr}`;
}

/**
 * 格式化趋势数据（双币种）
 * 返回格式: "+$0.00 / +¥0.00"
 * @param usd - 美元金额
 * @param cny - 人民币金额
 * @returns 带符号的双币种趋势字符串
 */
export function formatTrendMultiCurrency(
  usd: number,
  cny: number
): string {
  const signUsd = usd >= 0 ? '+' : '';
  const signCny = cny >= 0 ? '+' : '';
  const usdStr = formatAmountWithCurrency(Math.abs(usd), 'USD');
  const cnyStr = formatAmountWithCurrency(Math.abs(cny), 'CNY');
  return `${signUsd}${usdStr} / ${signCny}${cnyStr}`;
}
