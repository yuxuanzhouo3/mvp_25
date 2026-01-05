import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { accountLockout } from "@/lib/security/account-lockout";
import { logSecurityEvent } from "@/lib/utils/logger";
import { loginUser } from "@/lib/cloudbase/cloudbase-service";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // 验证输入
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurityEvent("login_validation_failed", undefined, clientIP, {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        { error: "输入格式不正确" },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // 检查账户是否被锁定
    const lockoutStatus = accountLockout.isLocked(email);
    if (lockoutStatus.locked) {
      logSecurityEvent("login_blocked_locked_account", undefined, clientIP, {
        email,
      });
      return NextResponse.json(
        {
          error: `账户已被临时锁定，请 ${lockoutStatus.remainingTimeMinutes} 分钟后再试`,
        },
        { status: 429 }
      );
    }

    if (isChinaRegion()) {
      console.log("[/api/auth/login] 中国区登录:", email);

      const userAgent = request.headers.get("user-agent") || undefined;
      const ipAddress = clientIP !== "unknown" ? clientIP : undefined;

      const result = await loginUser(email, password, {
        deviceInfo: userAgent,
        ipAddress,
        userAgent,
      });

      if (!result.success) {
        accountLockout.recordFailedAttempt(email, clientIP);
        logSecurityEvent("login_failed", undefined, clientIP, { email });
        return NextResponse.json(
          { error: result.error || "登录失败" },
          { status: 401 }
        );
      }

      const userId = result.userId;
      if (!userId) {
        return NextResponse.json(
          { error: "用户 ID 不存在" },
          { status: 401 }
        );
      }

      accountLockout.recordSuccessfulLogin(email);
      logSecurityEvent("login_success", userId, clientIP, { email });

      return NextResponse.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: userId,
          email: result.email || email,
          name: result.name || "",
        },
        tokenMeta: result.tokenMeta,
      });
    } else {
      return NextResponse.json(
        { error: "当前区域不支持" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[/api/auth/login] Error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
