import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/cloudbase/cloudbase-service";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import {
  generateOrderId,
  getAmountByCurrency,
  getDaysByBillingCycle,
  BillingCycle,
  PaymentMethod,
} from "@/lib/payment/payment-config";
import { createWechatNativePayment } from "@/lib/payment/providers/wechat-provider";
import { createAlipayPagePayment } from "@/lib/payment/providers/alipay-provider";
import { logInfo, logError, logSecurityEvent } from "@/lib/utils/logger";
import { z } from "zod";

const createPaymentSchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]),
  paymentMethod: z.enum(["wechat", "alipay"]),
});

/**
 * POST /api/payment/create
 * 创建支付订单
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // 验证用户身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const verifyResult = verifyJwtToken(token);

    if (!verifyResult.valid || !verifyResult.payload) {
      return NextResponse.json(
        { error: "登录已过期" },
        { status: 401 }
      );
    }

    const { userId } = verifyResult.payload;

    // 验证请求体
    const body = await request.json();
    const validationResult = createPaymentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "参数错误", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { billingCycle, paymentMethod } = validationResult.data;

    // 获取金额和天数
    const amount = getAmountByCurrency("CNY", billingCycle as BillingCycle);
    const days = getDaysByBillingCycle(billingCycle as BillingCycle);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "无效的价格配置" },
        { status: 500 }
      );
    }

    // 生成订单号
    const orderId = generateOrderId(paymentMethod === "wechat" ? "WX" : "ALI");

    logInfo("Creating payment order", {
      userId,
      orderId,
      billingCycle,
      paymentMethod,
      amount,
      days,
    });

    // 创建支付订单记录
    const db = getCloudBaseApp().database();
    const now = new Date().toISOString();

    await db.collection(CLOUDBASE_COLLECTIONS.PAYMENTS).add({
      user_id: userId,
      order_id: orderId,
      amount,
      currency: "CNY",
      status: "pending",
      payment_method: paymentMethod,
      billing_cycle: billingCycle,
      days,
      metadata: {
        days,
        billingCycle,
      },
      created_at: now,
      updated_at: now,
    });

    // 根据支付方式调用不同的支付提供商
    let paymentResult;
    const description = billingCycle === "monthly" ? "AI教师助手月度会员" : "AI教师助手年度会员";

    if (paymentMethod === "wechat") {
      paymentResult = await createWechatNativePayment(
        orderId,
        amount,
        description,
        userId
      );

      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error || "创建微信支付失败" },
          { status: 500 }
        );
      }

      logSecurityEvent("payment_created", userId, clientIP, {
        orderId,
        paymentMethod,
        amount,
      });

      return NextResponse.json({
        success: true,
        orderId,
        paymentMethod: "wechat",
        codeUrl: paymentResult.codeUrl,
        amount,
        billingCycle,
      });
    } else {
      // 支付宝
      paymentResult = await createAlipayPagePayment(
        orderId,
        amount,
        description,
        userId
      );

      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.error || "创建支付宝支付失败" },
          { status: 500 }
        );
      }

      logSecurityEvent("payment_created", userId, clientIP, {
        orderId,
        paymentMethod,
        amount,
      });

      return NextResponse.json({
        success: true,
        orderId,
        paymentMethod: "alipay",
        formHtml: paymentResult.formHtml,
        amount,
        billingCycle,
      });
    }
  } catch (error: any) {
    logError("Payment create error", error);

    return NextResponse.json(
      { error: "创建支付订单失败" },
      { status: 500 }
    );
  }
}
