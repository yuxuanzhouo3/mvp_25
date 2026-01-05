/**
 * PayPal 支付提供商（国际版）
 */

export interface PayPalPaymentOrder {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  paymentType: string;
  days?: number;
}

export interface PayPalPaymentResult {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  error?: string;
}

/**
 * 获取 PayPal 访问令牌
 */
async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const baseUrl = process.env.PAYPAL_SANDBOX === "true"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error("Failed to get PayPal access token:", error);
    return null;
  }
}

/**
 * 创建 PayPal 支付订单
 */
export async function createPayPalPayment(
  order: PayPalPaymentOrder
): Promise<PayPalPaymentResult> {
  const accessToken = await getPayPalAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: "PayPal 配置缺失或获取 access token 失败",
    };
  }

  const baseUrl = process.env.PAYPAL_SANDBOX === "true"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  try {
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: order.currency,
              value: order.amount.toFixed(2),
            },
            description: order.description,
            custom_id: JSON.stringify({
              userId: order.userId,
              paymentType: order.paymentType,
              days: order.days || 0,
            }),
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        },
      }),
    });

    const paypalOrder = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: paypalOrder.message || "创建 PayPal 订单失败",
      };
    }

    const approveLink = paypalOrder.links.find((link: any) => link.rel === "approve");

    return {
      success: true,
      paymentId: paypalOrder.id,
      paymentUrl: approveLink?.href,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "创建 PayPal 支付订单失败",
    };
  }
}

/**
 * 验证 PayPal Webhook 签名
 */
export async function verifyPayPalWebhook(
  body: any,
  transmissionId: string,
  transmissionSig: string,
  transmissionTime: string,
  certUrl: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error("PayPal webhook ID is missing");
    return false;
  }

  const accessToken = await getPayPalAccessToken();

  if (!accessToken) {
    console.error("Failed to get PayPal access token for webhook verification");
    return false;
  }

  const baseUrl = process.env.PAYPAL_SANDBOX === "true"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  try {
    const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: "SHA256withRSA",
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });

    const result = await response.json();
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("PayPal webhook verification failed:", error);
    return false;
  }
}
