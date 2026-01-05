/**
 * Stripe 支付提供商（国际版）
 * 使用 Checkout Session 模式进行一次性支付
 */

import Stripe from "stripe";

export interface StripePaymentOrder {
  userId: string;
  amount: number;
  currency: string;
  description: string;
  paymentType: string;
  days?: number;
}

export interface StripePaymentResult {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  error?: string;
}

/**
 * 获取 Stripe 客户端实例
 */
function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
  });
}

/**
 * 创建 Stripe 支付订单
 */
export async function createStripePayment(
  order: StripePaymentOrder
): Promise<StripePaymentResult> {
  const stripe = getStripeClient();

  if (!stripe) {
    return {
      success: false,
      error: "Stripe 配置缺失",
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: order.currency,
            unit_amount: Math.round(order.amount * 100), // 转换为美分
            product_data: {
              name: order.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: order.userId,
        paymentType: order.paymentType,
        days: order.days?.toString() || "0",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    });

    return {
      success: true,
      paymentId: session.id,
      paymentUrl: session.url || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "创建 Stripe 支付订单失败",
    };
  }
}

/**
 * 验证 Stripe Webhook 签名
 */
export function verifyStripeWebhook(
  body: string,
  signature: string
): Stripe.Event | null {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return null;
  }
}
