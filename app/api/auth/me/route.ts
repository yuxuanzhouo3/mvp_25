import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken, getUserById } from "@/lib/cloudbase/cloudbase-service";

// 生成默认头像 SVG
function generateDefaultAvatar(name: string, email: string): string {
  const displayName = name || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1"
  ];
  const colorIndex = email.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}"/>
      <text x="50" y="50" font-family="Arial,sans-serif" font-size="45" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initial}</text>
    </svg>`
  )}`;
}

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

    // 如果用户没有头像，生成默认头像
    const avatar = user.avatar || generateDefaultAvatar(user.name, user.email);

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: avatar,
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
