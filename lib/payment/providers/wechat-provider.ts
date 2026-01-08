/**
 * 微信支付 V3 API 提供商
 * 使用 Native 支付（二维码支付）
 */

import * as crypto from "crypto";
import { logInfo, logError } from "@/lib/utils/logger";

export interface WechatPayConfig {
  mchId: string;           // 商户号
  appId: string;           // 应用 ID
  apiKeyV3: string;        // APIv3 密钥
  serialNo: string;        // 证书序列号
  privateKey: string;      // 商户私钥
  notifyUrl: string;       // 回调通知地址
}

export interface WechatPayNativeResult {
  success: boolean;
  codeUrl?: string;        // 二维码链接
  prepayId?: string;       // 预支付交易会话标识
  orderId: string;
  error?: string;
}

export interface WechatPayNotification {
  out_trade_no: string;    // 商户订单号
  transaction_id: string;  // 微信支付订单号
  trade_state: string;     // 交易状态
  trade_type: string;      // 交易类型
  amount: {
    total: number;         // 订单金额（分）
    payer_total: number;   // 用户支付金额
    currency: string;
  };
  payer: {
    openid: string;
  };
  success_time: string;
}

/**
 * 获取微信支付配置
 */
export function getWechatPayConfig(): WechatPayConfig | null {
  const mchId = process.env.WECHAT_PAY_MCH_ID;
  const appId = process.env.WECHAT_PAY_APPID;
  const apiKeyV3 = process.env.WECHAT_PAY_API_KEY_V3;
  const serialNo = process.env.WECHAT_PAY_SERIAL_NO;
  const privateKey = process.env.WECHAT_PAY_PRIVATE_KEY;
  const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL;

  if (!mchId || !appId || !apiKeyV3 || !serialNo || !privateKey || !notifyUrl) {
    return null;
  }

  // 处理私钥格式：替换转义的换行符
  let formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

  // 如果私钥没有 PEM 头尾，则添加
  if (!formattedPrivateKey.includes("-----BEGIN")) {
    const cleanKey = formattedPrivateKey.replace(/\s/g, "");
    const keyLines = cleanKey.match(/.{1,64}/g)?.join("\n") || cleanKey;
    formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${keyLines}\n-----END PRIVATE KEY-----`;
  }

  return {
    mchId,
    appId,
    apiKeyV3,
    serialNo,
    privateKey: formattedPrivateKey,
    notifyUrl,
  };
}

/**
 * 生成微信支付 V3 签名
 */
function generateSignature(
  method: string,
  url: string,
  timestamp: string,
  nonceStr: string,
  body: string,
  privateKey: string
): string {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(message);
  return sign.sign(privateKey, "base64");
}

/**
 * 生成授权头
 */
function getAuthorizationHeader(
  method: string,
  url: string,
  body: string,
  config: WechatPayConfig
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const signature = generateSignature(
    method,
    url,
    timestamp,
    nonceStr,
    body,
    config.privateKey
  );

  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.serialNo}"`;
}

/**
 * 创建 Native 支付订单（生成二维码）
 */
export async function createWechatNativePayment(
  orderId: string,
  amount: number,
  description: string,
  userId: string
): Promise<WechatPayNativeResult> {
  const config = getWechatPayConfig();

  if (!config) {
    return {
      success: false,
      orderId,
      error: "微信支付配置缺失",
    };
  }

  try {
    const url = "/v3/pay/transactions/native";
    const fullUrl = `https://api.mch.weixin.qq.com${url}`;

    const requestBody = {
      appid: config.appId,
      mchid: config.mchId,
      description,
      out_trade_no: orderId,
      notify_url: config.notifyUrl,
      amount: {
        total: Math.round(amount * 100), // 转换为分
        currency: "CNY",
      },
      attach: JSON.stringify({ userId }), // 附加数据，回调时返回
    };

    const bodyStr = JSON.stringify(requestBody);
    const authorization = getAuthorizationHeader("POST", url, bodyStr, config);

    logInfo("Creating WeChat Native payment", {
      orderId,
      amount,
      userId,
    });

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok) {
      logError("WeChat pay create failed", new Error(data.message), {
        orderId,
        code: data.code,
      });

      return {
        success: false,
        orderId,
        error: data.message || "创建支付订单失败",
      };
    }

    logInfo("WeChat Native payment created", {
      orderId,
      codeUrl: data.code_url,
    });

    return {
      success: true,
      orderId,
      codeUrl: data.code_url,
    };
  } catch (error: any) {
    logError("WeChat pay error", error, { orderId });

    return {
      success: false,
      orderId,
      error: error.message || "创建支付订单异常",
    };
  }
}

/**
 * 验证微信支付回调签名
 */
export function verifyWechatPaySignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  platformCert: string
): boolean {
  try {
    const message = `${timestamp}\n${nonce}\n${body}\n`;

    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(message);
    return verify.verify(platformCert, signature, "base64");
  } catch (error) {
    logError("WeChat signature verification failed", error as Error);
    return false;
  }
}

/**
 * 解密微信支付回调数据
 */
export function decryptWechatPayNotification(
  ciphertext: string,
  associatedData: string,
  nonce: string,
  apiKeyV3: string
): WechatPayNotification | null {
  try {
    const key = Buffer.from(apiKeyV3, "utf-8");
    const iv = Buffer.from(nonce, "utf-8");
    const aad = Buffer.from(associatedData, "utf-8");
    const data = Buffer.from(ciphertext, "base64");

    // 分离认证标签（最后 16 字节）
    const authTag = data.slice(-16);
    const encrypted = data.slice(0, -16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(aad);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf-8"));
  } catch (error) {
    logError("WeChat notification decryption failed", error as Error);
    return null;
  }
}

/**
 * 验证微信支付回调通知（简化版）
 * 注意：完整验证需要获取微信平台证书
 */
export function verifyWechatNotification(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string
): boolean {
  // 简化处理：生产环境应该使用微信平台证书验证
  // 这里仅做基本检查
  if (!timestamp || !nonce || !body || !signature) {
    return false;
  }

  // 检查时间戳是否在合理范围内（5分钟）
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > 300) {
    logError("Wechat notification timestamp expired", new Error("Timestamp too old"));
    return false;
  }

  // TODO: 使用微信平台证书验证签名
  // 当前简化处理，直接返回 true
  // 生产环境必须实现完整的签名验证
  return true;
}

/**
 * 解密微信支付回调通知数据
 */
export function decryptWechatNotification(
  ciphertext: string,
  associatedData: string,
  nonce: string
): string | null {
  const config = getWechatPayConfig();
  if (!config) {
    return null;
  }

  try {
    const key = Buffer.from(config.apiKeyV3, "utf-8");
    const iv = Buffer.from(nonce, "utf-8");
    const aad = Buffer.from(associatedData, "utf-8");
    const data = Buffer.from(ciphertext, "base64");

    // 分离认证标签（最后 16 字节）
    const authTag = data.slice(-16);
    const encrypted = data.slice(0, -16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(aad);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf-8");
  } catch (error) {
    logError("WeChat notification decryption failed", error as Error);
    return null;
  }
}

/**
 * 查询微信支付订单状态
 */
export async function queryWechatPayment(
  orderId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const config = getWechatPayConfig();

  if (!config) {
    return { success: false, error: "微信支付配置缺失" };
  }

  try {
    const url = `/v3/pay/transactions/out-trade-no/${orderId}?mchid=${config.mchId}`;
    const fullUrl = `https://api.mch.weixin.qq.com${url}`;
    const authorization = getAuthorizationHeader("GET", url, "", config);

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "查询订单失败",
      };
    }

    return {
      success: true,
      status: data.trade_state,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "查询订单异常",
    };
  }
}
