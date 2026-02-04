import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent, logInfo } from "@/lib/utils/logger";
import { createRefreshToken } from "@/lib/auth/refresh-token-manager";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import * as jwt from "jsonwebtoken";

const miniprogramLoginSchema = z.object({
  code: z.string().min(1, "WeChat mini program code is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const validationResult = miniprogramLoginSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurityEvent("miniprogram_login_validation_failed", undefined, clientIP, {
        errors: validationResult.error.errors,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { code } = validationResult.data;

    if (!isChinaRegion()) {
      return NextResponse.json(
        {
          success: false,
          error: "Mini program authentication only available in China region",
          code: "REGION_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    const appId = process.env.WECHAT_MINIPROGRAM_APPID;
    const appSecret = process.env.WECHAT_MINIPROGRAM_SECRET;

    if (!appId || !appSecret) {
      logSecurityEvent("miniprogram_missing_config", undefined, clientIP, {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Mini program configuration missing",
          code: "CONFIG_ERROR",
        },
        { status: 500 }
      );
    }

    logInfo("Mini program: exchanging code for session", { code });

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );

    const data = await response.json();

    if (data.errcode) {
      logSecurityEvent("miniprogram_jscode2session_failed", undefined, clientIP, {
        errcode: data.errcode,
        errmsg: data.errmsg,
      });

      return NextResponse.json(
        {
          success: false,
          error: data.errmsg || "Failed to get session",
          code: "WECHAT_API_ERROR",
        },
        { status: 400 }
      );
    }

    const openid = data.openid;
    const sessionKey = data.session_key;

    logInfo("Mini program: got session", { openid });

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

    if (!userId) {
      logInfo("Creating new mini program user", { openid });

      const now = new Date().toISOString();
      const newUser = {
        wechat_miniprogram_openid: openid,
        email: `miniprogram_${openid}@local.wechat`,
        name: "小程序用户",
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

      logSecurityEvent("miniprogram_user_created", userId, clientIP, {
        openid,
      });
    } else {
      logInfo("Updating existing mini program user", { userId, openid });

      const now = new Date().toISOString();
      await usersCollection.doc(userId).update({
        login_count: (existingUser?.login_count || 0) + 1,
        last_login_at: now,
        last_login_ip: clientIP,
        updated_at: now,
      });

      logSecurityEvent("miniprogram_login_successful", userId, clientIP, {
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

    logInfo("Generated refresh token for mini program user", { userId });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: `miniprogram_${openid}@local.wechat`,
        name: "小程序用户",
        openid: openid,
      },
      tokenMeta: {
        accessTokenExpiresIn: 3600,
        refreshTokenExpiresIn: 604800,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Mini program login error:", errorMessage);
    logSecurityEvent(
      "miniprogram_login_error",
      undefined,
      request.headers.get("x-forwarded-for") || "unknown",
      {
        error: errorMessage,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "Mini program login failed",
        code: "MINIPROGRAM_LOGIN_FAILED",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
