import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent, logInfo } from "@/lib/utils/logger";
import { createRefreshToken } from "@/lib/auth/refresh-token-manager";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import * as jwt from "jsonwebtoken";

const wxloginSchema = z.object({
  code: z.string().min(1, "WeChat code is required"),
  nickName: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[wxlogin] ========== Request Start ==========");
    console.log("[wxlogin] NEXT_PUBLIC_DEPLOYMENT_REGION:", process.env.NEXT_PUBLIC_DEPLOYMENT_REGION);
    console.log("[wxlogin] isChinaRegion():", isChinaRegion());

    const body = await request.json();
    console.log("[wxlogin] Request body:", { hasCode: !!body.code, hasNickName: !!body.nickName, hasAvatarUrl: !!body.avatarUrl });

    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    console.log("[wxlogin] Client IP:", clientIP);

    const validationResult = wxloginSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("[wxlogin] Validation failed:", validationResult.error.errors);
      logSecurityEvent("wxlogin_validation_failed", undefined, clientIP, {
        errors: validationResult.error.errors,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          message: "code is required",
        },
        { status: 400 }
      );
    }

    const { code, nickName, avatarUrl } = validationResult.data;
    console.log("[wxlogin] Validation passed");

    if (!isChinaRegion()) {
      console.error("[wxlogin] Region check failed - not China region");
      return NextResponse.json(
        {
          success: false,
          error: "REGION_NOT_SUPPORTED",
          message: "WeChat login only available in China region",
        },
        { status: 400 }
      );
    }
    console.log("[wxlogin] Region check passed");

    const appId = process.env.WECHAT_MINIPROGRAM_APPID;
    const appSecret = process.env.WECHAT_MINIPROGRAM_SECRET;
    console.log("[wxlogin] Config check:", {
      hasAppId: !!appId,
      appIdPrefix: appId ? appId.substring(0, 6) : "none",
      hasAppSecret: !!appSecret
    });

    if (!appId || !appSecret) {
      console.error("[wxlogin] Missing WeChat configuration");
      logSecurityEvent("wxlogin_missing_config", undefined, clientIP, {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
      });

      return NextResponse.json(
        {
          success: false,
          error: "CONFIG_ERROR",
          message: "WeChat mini program configuration missing",
        },
        { status: 500 }
      );
    }

    console.log("[wxlogin] Calling WeChat jscode2session API...");
    logInfo("WeChat mini program: exchanging code for session", { code });

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );

    const data = await response.json();
    console.log("[wxlogin] WeChat API response:", {
      hasError: !!data.errcode,
      errcode: data.errcode,
      errmsg: data.errmsg,
      hasOpenid: !!data.openid
    });

    if (data.errcode) {
      console.error("[wxlogin] WeChat API error:", data.errcode, data.errmsg);
      logSecurityEvent("wxlogin_jscode2session_failed", undefined, clientIP, {
        errcode: data.errcode,
        errmsg: data.errmsg,
      });

      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CODE",
          message: data.errmsg || "WeChat code invalid or expired",
        },
        { status: 400 }
      );
    }

    const openid = data.openid;
    const sessionKey = data.session_key;
    console.log("[wxlogin] Got openid successfully");

    logInfo("WeChat mini program: got session", { openid });

    const app = getCloudBaseApp();
    const db = app.database();
    const usersCollection = db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS);

    let userId: string | null = null;
    let existingUser: any = null;

    try {
      const queryResult = await usersCollection
        .where({
          wechat_miniprogram_openid: openid,
        })
        .limit(1)
        .get();

      if (queryResult.data && queryResult.data.length > 0) {
        existingUser = queryResult.data[0];
        userId = existingUser._id;
      }
    } catch (queryError) {
      logInfo("First time mini program user", { openid });
    }

    const now = new Date().toISOString();

    if (!userId) {
      logInfo("Creating new mini program user", { openid });

      const newUser = {
        wechat_miniprogram_openid: openid,
        wechat_session_key: sessionKey,
        email: `miniprogram_${openid}@local.wechat`,
        name: nickName || "小程序用户",
        avatar: avatarUrl || null,
        pro: false,
        subscription_plan: "free",
        subscription_status: "inactive",
        login_count: 1,
        last_login_at: now,
        last_login_ip: clientIP,
        created_at: now,
        updated_at: now,
        region: "china",
      };

      const insertResult = await usersCollection.add(newUser);
      userId = insertResult.id;

      logSecurityEvent("wxlogin_user_created", userId, clientIP, {
        openid,
      });
    } else {
      logInfo("Updating existing mini program user", { userId, openid });

      const updateData: any = {
        wechat_session_key: sessionKey,
        login_count: (existingUser?.login_count || 0) + 1,
        last_login_at: now,
        last_login_ip: clientIP,
        updated_at: now,
      };

      if (nickName) {
        updateData.name = nickName;
      }
      if (avatarUrl) {
        updateData.avatar = avatarUrl;
      }

      await usersCollection.doc(userId).update(updateData);

      logSecurityEvent("wxlogin_login_successful", userId, clientIP, {
        openid,
      });
    }

    if (!userId) {
      throw new Error("Failed to create or find user");
    }

    const accessPayload = {
      userId,
      email: `miniprogram_${openid}@local.wechat`,
      region: "CN",
    };

    const accessToken = jwt.sign(
      accessPayload,
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
      {
        expiresIn: "1h",
      }
    );

    logInfo("Generated access token for mini program user", { userId });

    const refreshTokenResult = await createRefreshToken({
      userId,
      email: `miniprogram_${openid}@local.wechat`,
      deviceInfo: "wechat-miniprogram",
      ipAddress: clientIP,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!refreshTokenResult) {
      throw new Error("Failed to create refresh token");
    }

    const refreshToken = refreshTokenResult.refreshToken;
    const expiresIn = 7 * 24 * 60 * 60;

    logInfo("Generated refresh token for mini program user", { userId });

    const res = NextResponse.json({
      success: true,
      token: accessToken,
      openid: openid,
      expiresIn: expiresIn,
      user: {
        id: userId,
        openid: openid,
        nickName: nickName || existingUser?.name || "小程序用户",
        avatarUrl: avatarUrl || existingUser?.avatar || null,
        email: `miniprogram_${openid}@local.wechat`,
      },
    });

    res.cookies.set("auth-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn,
      path: "/",
    });

    return res;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("WeChat mini program login error:", errorMessage);
    logSecurityEvent(
      "wxlogin_error",
      undefined,
      request.headers.get("x-forwarded-for") || "unknown",
      {
        error: errorMessage,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "SERVER_ERROR",
        message: "WeChat mini program login failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
