import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/cloudbase/cloudbase-service";
import { revokeAllUserTokens } from "@/lib/auth/refresh-token-manager";
import { logSecurityEvent } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

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

    // 撤销所有 refresh tokens
    const revokeResult = await revokeAllUserTokens(userId, "logout");

    logSecurityEvent("logout", userId, clientIP, {
      revokedTokens: revokeResult.revokedCount,
    });

    return NextResponse.json({
      success: true,
      message: "登出成功",
    });
  } catch (error: any) {
    console.error("[/api/auth/logout] Error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
