import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { verifyRefreshToken } from "@/lib/auth/refresh-token-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token 不能为空" },
        { status: 400 }
      );
    }

    // 验证 refresh token
    const verifyResult = await verifyRefreshToken(refreshToken);

    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || "无效的 refresh token" },
        { status: 401 }
      );
    }

    // 生成新的 access token
    const tokenPayload = {
      userId: verifyResult.userId,
      email: verifyResult.email,
      region: "china",
    };

    const newAccessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      tokenMeta: {
        accessTokenExpiresIn: 3600,
      },
    });
  } catch (error: any) {
    console.error("[/api/auth/refresh] Error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
