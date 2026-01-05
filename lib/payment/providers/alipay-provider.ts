/**
 * 支付宝支付提供商
 * 使用电脑网站支付（alipay.trade.page.pay）
 */

import * as crypto from "crypto";
import { logInfo, logError } from "@/lib/utils/logger";

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  notifyUrl: string;
  returnUrl: string;
  sandbox: boolean;
}

export interface AlipayPageResult {
  success: boolean;
  formHtml?: string;    // 支付宝返回的表单 HTML
  orderId: string;
  error?: string;
}

export interface AlipayNotification {
  out_trade_no: string;      // 商户订单号
  trade_no: string;          // 支付宝交易号
  trade_status: string;      // 交易状态
  total_amount: string;      // 订单金额
  receipt_amount?: string;   // 实收金额
  buyer_id?: string;         // 买家支付宝用户ID
  passback_params?: string;  // 公用回传参数
  gmt_payment?: string;      // 交易付款时间
}

/**
 * 获取支付宝配置
 */
export function getAlipayConfig(): AlipayConfig | null {
  const appId = process.env.ALIPAY_APP_ID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_ALIPAY_PUBLIC_KEY;
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL;
  const returnUrl = process.env.ALIPAY_RETURN_URL;
  const sandbox = process.env.ALIPAY_SANDBOX === "true";

  if (!appId || !privateKey || !alipayPublicKey || !notifyUrl || !returnUrl) {
    return null;
  }

  return {
    appId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    alipayPublicKey: alipayPublicKey.replace(/\\n/g, "\n"),
    notifyUrl,
    returnUrl,
    sandbox,
  };
}

/**
 * 获取支付宝网关 URL
 */
function getAlipayGateway(sandbox: boolean): string {
  return sandbox
    ? "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
    : "https://openapi.alipay.com/gateway.do";
}

/**
 * 生成支付宝签名
 */
function signWithRSA2(content: string, privateKey: string): string {
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(content, "utf-8");
  return sign.sign(privateKey, "base64");
}

/**
 * 验证支付宝签名
 */
export function verifyAlipaySignature(
  params: Record<string, string>,
  sign: string,
  alipayPublicKey: string
): boolean {
  try {
    // 移除 sign 和 sign_type 参数
    const { sign: _, sign_type: __, ...restParams } = params;

    // 按字母顺序排序并拼接
    const sortedKeys = Object.keys(restParams).sort();
    const stringToSign = sortedKeys
      .filter((key) => restParams[key] !== undefined && restParams[key] !== "")
      .map((key) => `${key}=${restParams[key]}`)
      .join("&");

    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(stringToSign, "utf-8");
    return verify.verify(alipayPublicKey, sign, "base64");
  } catch (error) {
    logError("Alipay signature verification failed", error as Error);
    return false;
  }
}

/**
 * 验证支付宝回调通知（简化版，使用配置中的公钥）
 */
export function verifyAlipayNotification(
  params: Record<string, string>
): boolean {
  const config = getAlipayConfig();
  if (!config) {
    logError("Alipay config not found", new Error("Config missing"));
    return false;
  }

  const sign = params.sign;
  if (!sign) {
    logError("Alipay notification missing sign", new Error("Sign missing"));
    return false;
  }

  return verifyAlipaySignature(params, sign, config.alipayPublicKey);
}

/**
 * 创建支付宝电脑网站支付
 */
export async function createAlipayPagePayment(
  orderId: string,
  amount: number,
  subject: string,
  userId: string
): Promise<AlipayPageResult> {
  const config = getAlipayConfig();

  if (!config) {
    return {
      success: false,
      orderId,
      error: "支付宝配置缺失",
    };
  }

  try {
    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    // 业务参数
    const bizContent = JSON.stringify({
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject,
      product_code: "FAST_INSTANT_TRADE_PAY",
      passback_params: encodeURIComponent(userId), // 回调时返回
    });

    // 公共参数
    const params: Record<string, string> = {
      app_id: config.appId,
      method: "alipay.trade.page.pay",
      format: "JSON",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp,
      version: "1.0",
      notify_url: config.notifyUrl,
      return_url: config.returnUrl,
      biz_content: bizContent,
    };

    // 生成签名
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    params.sign = signWithRSA2(stringToSign, config.privateKey);

    logInfo("Creating Alipay page payment", {
      orderId,
      amount,
      userId,
    });

    // 构建表单 HTML
    const gateway = getAlipayGateway(config.sandbox);
    const formInputs = Object.entries(params)
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${key}" value="${value
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}" />`
      )
      .join("\n");

    const formHtml = `
      <form id="alipay_form" action="${gateway}" method="POST" style="display:none;">
        ${formInputs}
      </form>
      <script>document.getElementById('alipay_form').submit();</script>
    `;

    return {
      success: true,
      orderId,
      formHtml,
    };
  } catch (error: any) {
    logError("Alipay page payment error", error, { orderId });

    return {
      success: false,
      orderId,
      error: error.message || "创建支付订单异常",
    };
  }
}

/**
 * 查询支付宝订单状态
 */
export async function queryAlipayPayment(
  orderId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const config = getAlipayConfig();

  if (!config) {
    return { success: false, error: "支付宝配置缺失" };
  }

  try {
    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const bizContent = JSON.stringify({
      out_trade_no: orderId,
    });

    const params: Record<string, string> = {
      app_id: config.appId,
      method: "alipay.trade.query",
      format: "JSON",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp,
      version: "1.0",
      biz_content: bizContent,
    };

    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    params.sign = signWithRSA2(stringToSign, config.privateKey);

    const gateway = getAlipayGateway(config.sandbox);
    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    const response = await fetch(`${gateway}?${queryString}`, {
      method: "GET",
    });

    const data = await response.json();
    const result = data.alipay_trade_query_response;

    if (result.code !== "10000") {
      return {
        success: false,
        error: result.sub_msg || result.msg || "查询订单失败",
      };
    }

    return {
      success: true,
      status: result.trade_status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "查询订单异常",
    };
  }
}
