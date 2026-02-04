import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent, logInfo } from "@/lib/utils/logger";
import { getWechatUserByCode } from "@/lib/wechat/token-exchange";
import { createRefreshToken } from "@/lib/auth/refresh-token-manager";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import * as jwt from "jsonwebtoken";

const appLoginSchema = z.object({
  code: z.string().min(1, "WeChat app authorization code is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const validationResult = appLoginSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurityEvent("app_login_validation_failed", undefined, clientIP, {
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
          error: "WeChat app authentication only available in China region",
          code: "REGION_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    const appId = process.env.WECHAT_APP_APPID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      logSecurityEvent("app_missing_config", undefined, clientIP, {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
      });

      return NextResponse.json(
        {
          success: false,
          error: "WeChat app configuration missing",
          code: "CONFIG_ERROR",
        },
        { status: 500 }
      );
    }

    logInfo("WeChat App OAuth: exchanging code for access_token", { code });

    const wechatUser = await getWechatUserByCode(code, appId, appSecret);

    logInfo("WeChat App OAuth: got user info", {
      openid: wechatUser.openid,
      nickname: wechatUser.nickname,
    });

    const openid = wechatUser.openid;
    const app = getCloudBaseApp();
    const db = app.database();
    const usersCollection = db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS);

    let userId: string | null = null;
    let existingUser: any = null;

    try {
      const queryResult = await usersCollection
        .where({
          wechat_app_openid: openid,
        })
        .limit(1)
        .get();

      if (queryResult.data && queryResult.data.length > 0) {
        existingUser = queryResult.data[0];
        userId = existingUser._id;
      }
    } catch (queryError) {
      logInfo("First time WeChat app user", { openid });
    }

    if (!userId) {
      logInfo("Creating new WeChat app user", { openid });

      const now = new Date().toISOString();
      const newUser = {
        wechat_app_openid: openid,
        wechat_unionid: wechatUser.unionid,
        email: `wechat_app_${openid}@local.wechat`,
        name: wechatUser.nickname,
        avatar: wechatUser.headimgurl,
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

      logSecurityEvent("wechat_app_user_created", userId, clientIP, {
        openid,
        nickname: wechatUser.nickname,
      });
    } else {
      logInfo("Updating existing WeChat app user", { userId, openid });

      const now = new Date().toISOString();
      await usersCollection.doc(userId).update({
        login_count: (existingUser?.login_count || 0) + 1,
        last_login_at: now,
        last_login_ip: clientIP,
        avatar: wechatUser.headimgurl,
        name: wechatUser.nickname,
        updated_at: now,
      });

      logSecurityEvent("wechat_app_login_successful", userId, clientIP, {
        openid,
      });
    }

    if (!userId) {
      throw new Error("Failed to create or find user");
    }

    const accessPayload = {
      userId,
      email: `wechat_app_${openid}@local.wechat`,
      region: "CN",
    };

    const accessToken = jwt.sign(
      accessPayload,
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
      {
        expiresIn: "1h",
      }
    );

    logInfo("Generated access token for WeChat app user", { userId });

    const refreshTokenResult = await createRefreshToken({
      userId,
      email: `wechat_app_${openid}@local.wechat`,
      deviceInfo: "wechat-app",
      ipAddress: clientIP,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!refreshTokenResult) {
      throw new Error("Failed to create refresh token");
    }

    const refreshToken = refreshTokenResult.refreshToken;

    logInfo("Generated refresh token for WeChat app user", { userId });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: `wechat_app_${openid}@local.wechat`,
        name: wechatUser.nickname,
        avatar: wechatUser.headimgurl,
        openid: wechatUser.openid,
      },
      tokenMeta: {
        accessTokenExpiresIn: 3600,
        refreshTokenExpiresIn: 604800,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("WeChat app login error:", errorMessage);
    logSecurityEvent(
      "wechat_app_login_error",
      undefined,
      request.headers.get("x-forwarded-for") || "unknown",
      {
        error: errorMessage,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "WeChat app login failed",
        code: "WECHAT_APP_LOGIN_FAILED",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
