import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken, getUserById } from "@/lib/cloudbase/cloudbase-service";

export async function GET(request: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "未提供认证信息" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 验证 token
    const verifyResult = verifyJwtToken(token);
    if (!verifyResult.valid || !verifyResult.payload) {
      return NextResponse.json(
        { error: "无效的认证令牌" },
        { status: 401 }
      );
    }

    const { userId } = verifyResult.payload;

    // 获取用户信息
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        pro: user.pro,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        membership_expires_at: user.membership_expires_at,
      },
    });
  } catch (error: any) {
    console.error("[/api/auth/me] Error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
