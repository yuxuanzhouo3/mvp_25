import { NextRequest, NextResponse } from "next/server";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import { verifyAlipayNotification } from "@/lib/payment/providers/alipay-provider";
import { logInfo, logError, logSecurityEvent } from "@/lib/utils/logger";

/**
 * POST /api/payment/webhook/alipay
 * 支付宝支付回调通知
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // 支付宝回调是 form-urlencoded 格式
    const formData = await request.formData();
    const params: Record<string, string> = {};

    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    logInfo("Alipay webhook received", {
      tradeNo: params.out_trade_no,
      tradeStatus: params.trade_status,
    });

    // 验证签名
    const isValid = verifyAlipayNotification(params);

    if (!isValid) {
      logSecurityEvent("alipay_webhook_invalid_signature", "system", clientIP, {
        tradeNo: params.out_trade_no,
      });

      return new NextResponse("fail", { status: 400 });
    }

    const orderId = params.out_trade_no;
    const tradeStatus = params.trade_status;
    const tradeNo = params.trade_no; // 支付宝交易号

    // 只处理支付成功
    if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
      return new NextResponse("success");
    }

    // 更新订单状态
    const db = getCloudBaseApp().database();
    const now = new Date().toISOString();

    // 查询订单
    const { data: orders } = await db
      .collection(CLOUDBASE_COLLECTIONS.PAYMENTS)
      .where({ order_id: orderId })
      .get();

    if (!orders || orders.length === 0) {
      logError("Order not found for alipay webhook", new Error(`Order ${orderId} not found`));
      return new NextResponse("success");
    }

    const order = orders[0];

    // 防止重复处理
    if (order.status === "paid") {
      logInfo("Order already paid, skipping", { orderId });
      return new NextResponse("success");
    }

    // 验证金额（支付宝金额单位是元）
    const notifyAmount = parseFloat(params.total_amount);
    const orderAmount = order.amount / 100; // 转换为元

    if (Math.abs(notifyAmount - orderAmount) > 0.01) {
      logError("Amount mismatch in alipay webhook", new Error(`Expected ${orderAmount}, got ${notifyAmount}`));
      return new NextResponse("fail", { status: 400 });
    }

    // 更新订单状态
    await db
      .collection(CLOUDBASE_COLLECTIONS.PAYMENTS)
      .doc(order._id)
      .update({
        status: "paid",
        transaction_id: tradeNo,
        paid_at: now,
        updated_at: now,
        webhook_data: params,
      });

    // 创建或更新订阅记录
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (order.days || 30));

    // 查询现有订阅
    const { data: existingSubs } = await db
      .collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS)
      .where({ user_id: order.user_id })
      .get();

    if (existingSubs && existingSubs.length > 0) {
      // 更新现有订阅
      const existingSub = existingSubs[0];
      const currentEndDate = new Date(existingSub.end_date);
      const newEndDate = currentEndDate > new Date()
        ? new Date(currentEndDate.getTime() + order.days * 24 * 60 * 60 * 1000)
        : subscriptionEndDate;

      await db
        .collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS)
        .doc(existingSub._id)
        .update({
          status: "active",
          end_date: newEndDate.toISOString(),
          updated_at: now,
        });
    } else {
      // 创建新订阅
      await db.collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS).add({
        user_id: order.user_id,
        plan: order.billing_cycle === "yearly" ? "yearly" : "monthly",
        status: "active",
        start_date: now,
        end_date: subscriptionEndDate.toISOString(),
        payment_id: order._id,
        created_at: now,
        updated_at: now,
      });
    }

    logSecurityEvent("payment_completed", order.user_id, clientIP, {
      orderId,
      transactionId: tradeNo,
      amount: order.amount,
      paymentMethod: "alipay",
    });

    // 支付宝要求返回 success 字符串
    return new NextResponse("success");
  } catch (error: any) {
    logError("Alipay webhook error", error);

    return new NextResponse("fail", { status: 500 });
  }
}
