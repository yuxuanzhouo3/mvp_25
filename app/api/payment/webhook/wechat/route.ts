import { NextRequest, NextResponse } from "next/server";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import { verifyWechatNotification, decryptWechatNotification } from "@/lib/payment/providers/wechat-provider";
import { logInfo, logError, logSecurityEvent } from "@/lib/utils/logger";

/**
 * POST /api/payment/webhook/wechat
 * 微信支付回调通知
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // 获取微信签名信息
    const timestamp = request.headers.get("Wechatpay-Timestamp") || "";
    const nonce = request.headers.get("Wechatpay-Nonce") || "";
    const signature = request.headers.get("Wechatpay-Signature") || "";
    const serial = request.headers.get("Wechatpay-Serial") || "";

    // 获取请求体
    const body = await request.text();

    logInfo("Wechat webhook received", {
      timestamp,
      nonce,
      serial,
      bodyLength: body.length,
    });

    // 验证签名（生产环境必须验证）
    // 注意：完整的签名验证需要获取微信平台证书
    // 这里简化处理，实际生产需要完善
    const isValid = verifyWechatNotification(timestamp, nonce, body, signature);

    if (!isValid) {
      logSecurityEvent("wechat_webhook_invalid_signature", "system", clientIP, {
        timestamp,
        nonce,
      });

      // 微信要求返回特定格式
      return NextResponse.json(
        { code: "FAIL", message: "签名验证失败" },
        { status: 400 }
      );
    }

    // 解析通知内容
    const notification = JSON.parse(body);

    if (notification.event_type !== "TRANSACTION.SUCCESS") {
      // 非支付成功事件，直接返回成功
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    // 解密支付结果
    const resource = notification.resource;
    const decryptedData = decryptWechatNotification(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce
    );

    if (!decryptedData) {
      logError("Failed to decrypt wechat notification", new Error("Decryption failed"));
      return NextResponse.json(
        { code: "FAIL", message: "解密失败" },
        { status: 400 }
      );
    }

    const paymentResult = JSON.parse(decryptedData);
    const orderId = paymentResult.out_trade_no;
    const transactionId = paymentResult.transaction_id;
    const tradeState = paymentResult.trade_state;

    logInfo("Wechat payment notification", {
      orderId,
      transactionId,
      tradeState,
    });

    // 只处理支付成功
    if (tradeState !== "SUCCESS") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
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
      logError("Order not found for wechat webhook", new Error(`Order ${orderId} not found`));
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    const order = orders[0];

    // 防止重复处理
    if (order.status === "paid") {
      logInfo("Order already paid, skipping", { orderId });
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    // 更新订单状态
    await db
      .collection(CLOUDBASE_COLLECTIONS.PAYMENTS)
      .doc(order._id)
      .update({
        status: "paid",
        transaction_id: transactionId,
        paid_at: now,
        updated_at: now,
        webhook_data: paymentResult,
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
      transactionId,
      amount: order.amount,
      paymentMethod: "wechat",
    });

    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  } catch (error: any) {
    logError("Wechat webhook error", error);

    return NextResponse.json(
      { code: "FAIL", message: "处理失败" },
      { status: 500 }
    );
  }
}
