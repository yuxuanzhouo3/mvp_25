import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/cloudbase/cloudbase-service";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import { logInfo, logError } from "@/lib/utils/logger";
import { queryWechatPayment } from "@/lib/payment/providers/wechat-provider";
import { z } from "zod";

const statusQuerySchema = z.object({
  orderId: z.string().min(1, "订单号不能为空"),
});

/**
 * GET /api/payment/status?orderId=xxx
 * 查询支付订单状态
 */
export async function GET(request: NextRequest) {
  try {
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

    // 获取订单号
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");

    const validationResult = statusQuerySchema.safeParse({ orderId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "参数错误", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // 查询订单
    const db = getCloudBaseApp().database();
    const { data } = await db
      .collection(CLOUDBASE_COLLECTIONS.PAYMENTS)
      .where({
        order_id: orderId,
        user_id: userId,
      })
      .get();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "订单不存在" },
        { status: 404 }
      );
    }

    const order = data[0];

    // 如果订单状态是 pending 且是微信支付，主动查询微信支付状态
    if (order.status === "pending" && order.payment_method === "wechat") {
      logInfo("Querying WeChat payment status", { orderId });

      const wechatResult = await queryWechatPayment(orderId as string);

      if (wechatResult.success && wechatResult.status === "SUCCESS") {
        // 微信已支付成功，更新数据库
        const now = new Date().toISOString();

        await db
          .collection(CLOUDBASE_COLLECTIONS.PAYMENTS)
          .doc(order._id)
          .update({
            status: "paid",
            paid_at: now,
            updated_at: now,
          });

        // 创建或更新订阅记录
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (order.days || 30));

        const { data: existingSubs } = await db
          .collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS)
          .where({ user_id: order.user_id })
          .get();

        if (existingSubs && existingSubs.length > 0) {
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

        logInfo("Payment status updated via polling", {
          userId,
          orderId,
          status: "paid",
        });

        return NextResponse.json({
          success: true,
          order: {
            orderId: order.order_id,
            status: "paid",
            amount: order.amount,
            currency: order.currency,
            paymentMethod: order.payment_method,
            billingCycle: order.billing_cycle,
            createdAt: order.created_at,
            paidAt: now,
          },
        });
      }
    }

    logInfo("Payment status queried", {
      userId,
      orderId,
      status: order.status,
    });

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.order_id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        paymentMethod: order.payment_method,
        billingCycle: order.billing_cycle,
        createdAt: order.created_at,
        paidAt: order.paid_at,
      },
    });
  } catch (error: any) {
    logError("Payment status query error", error);

    return NextResponse.json(
      { error: "查询订单状态失败" },
      { status: 500 }
    );
  }
}
