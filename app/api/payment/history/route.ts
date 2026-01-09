import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/cloudbase/cloudbase-service";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import { logInfo, logError } from "@/lib/utils/logger";

/**
 * GET /api/payment/history
 * 获取当前用户的支付记录
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
    const db = getCloudBaseApp().database();

    // 查询支付记录
    const { data } = await db
      .collection(CLOUDBASE_COLLECTIONS.PAYMENTS)
      .where({ user_id: userId })
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    // 转换数据格式
    const payments = (data || []).map((p: any) => ({
      id: p._id,
      paymentId: p.order_id,
      amount: p.amount,
      currency: p.currency || "CNY",
      provider: p.payment_method,
      status: p.status === "paid" ? "completed" : p.status,
      description: `${p.billing_cycle === "yearly" ? "年度" : "月度"}会员`,
      createdAt: p.created_at,
    }));

    logInfo("Payment history fetched", {
      userId,
      count: payments.length,
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    logError("Payment history fetch error", error);

    return NextResponse.json(
      { error: "获取支付记录失败" },
      { status: 500 }
    );
  }
}
