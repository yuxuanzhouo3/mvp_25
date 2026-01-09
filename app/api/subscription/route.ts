import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/cloudbase/cloudbase-service";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import { logInfo, logError } from "@/lib/utils/logger";

/**
 * GET /api/subscription
 * 获取当前用户的订阅信息
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

    // 查询订阅记录
    const { data } = await db
      .collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS)
      .where({ user_id: userId })
      .orderBy("created_at", "desc")
      .limit(1)
      .get();

    if (!data || data.length === 0) {
      logInfo("No subscription found", { userId });
      return NextResponse.json({
        subscription: null,
      });
    }

    const sub = data[0];

    // 检查订阅是否过期
    const endDate = new Date(sub.end_date);
    const isExpired = endDate < new Date();
    const status = isExpired ? "expired" : sub.status;

    logInfo("Subscription fetched", {
      userId,
      plan: sub.plan,
      status,
      endDate: sub.end_date,
    });

    return NextResponse.json({
      subscription: {
        id: sub._id,
        userId: sub.user_id,
        plan: sub.plan === "yearly" ? "pro" : sub.plan === "monthly" ? "pro" : "free",
        status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        autoRenew: false,
      },
    });
  } catch (error: any) {
    logError("Subscription fetch error", error);

    return NextResponse.json(
      { error: "获取订阅信息失败" },
      { status: 500 }
    );
  }
}
