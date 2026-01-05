import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent } from "@/lib/utils/logger";
import { signupUser } from "@/lib/cloudbase/cloudbase-service";

const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少需要6个字符"),
  confirmPassword: z.string(),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // 验证输入
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurityEvent("register_validation_failed", undefined, clientIP, {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: validationResult.error.errors[0]?.message || "输入格式不正确"
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    if (isChinaRegion()) {
      console.log("[/api/auth/register] 中国区注册:", email);

      const userAgent = request.headers.get("user-agent") || undefined;
      const ipAddress = clientIP !== "unknown" ? clientIP : undefined;

      const result = await signupUser(email, password, name, {
        deviceInfo: userAgent,
        ipAddress,
        userAgent,
      });

      if (!result.success) {
        logSecurityEvent("register_failed", undefined, clientIP, {
          email,
          error: result.error,
        });
        return NextResponse.json(
          { error: result.error || "注册失败" },
          { status: 400 }
        );
      }

      logSecurityEvent("register_success", result.userId, clientIP, { email });

      return NextResponse.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.userId,
          email: email,
          name: name || email.split("@")[0],
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
    console.error("[/api/auth/register] Error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
