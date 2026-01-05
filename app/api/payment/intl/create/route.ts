/**
 * 创建国际版支付订单 API
 */

import { NextRequest, NextResponse } from "next/server";
import { createStripePayment } from "@/lib/payment/providers/stripe-provider";
import { createPayPalPayment } from "@/lib/payment/providers/paypal-provider";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const provider = data.provider;
    const amount = data.amount;
    const currency = data.currency;
    const userId = data.userId;
    const paymentType = data.paymentType;
    const days = data.days;

    if (\!provider || \!amount || \!currency || \!userId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const orderId = "intl_" + Date.now() + "_" + Math.random().toString(36).substring(7);
    const description = "AI Teacher " + paymentType + " - " + days + " days";

    let result;

    if (provider === "stripe") {
      result = await createStripePayment({
        userId,
        amount,
        currency: currency || "USD",
        description,
        paymentType,
        days,
      });
    } else if (provider === "paypal") {
      result = await createPayPalPayment({
        userId,
        amount,
        currency: currency || "USD",
        description,
        paymentType,
        days,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "不支持的支付方式" },
        { status: 400 }
      );
    }

    if (\!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();
    await supabase.from("payments").insert({
      user_id: userId,
      payment_id: result.paymentId,
      provider,
      amount,
      currency: currency || "USD",
      status: "pending",
      metadata: { paymentType, days },
    });

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
      orderId,
    });
  } catch (error: any) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "创建支付订单失败" },
      { status: 500 }
    );
  }
}
