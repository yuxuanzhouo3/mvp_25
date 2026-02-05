import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent, logInfo } from "@/lib/utils/logger";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";
import * as jwt from "jsonwebtoken";
import { createRefreshToken } from "@/lib/auth/refresh-token-manager";

const checkSchema = z.object({
  code: z.string().min(1, "WeChat code is required"),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[wxlogin/check] ========== Request Start ==========");
    console.log("[wxlogin/check] NEXT_PUBLIC_DEPLOYMENT_REGION:", process.env.NEXT_PUBLIC_DEPLOYMENT_REGION);
    console.log("[wxlogin/check] isChinaRegion():", isChinaRegion());

    const body = await request.json();
    console.log("[wxlogin/check] Request body received:", { hasCode: !!body.code });

    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    console.log("[wxlogin/check] Client IP:", clientIP);

    const validationResult = checkSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("[wxlogin/check] Validation failed:", validationResult.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          message: "code is required",
        },
        { status: 400 }
      );
    }

    const { code } = validationResult.data;
    console.log("[wxlogin/check] Code validated successfully");

    if (!isChinaRegion()) {
      console.error("[wxlogin/check] Region check failed - not China region");
      return NextResponse.json(
        {
          success: false,
          error: "REGION_NOT_SUPPORTED",
          message: "WeChat login only available in China region",
        },
        { status: 400 }
      );
    }
    console.log("[wxlogin/check] Region check passed - China region confirmed");

    const appId = process.env.WECHAT_MINIPROGRAM_APPID;
    const appSecret = process.env.WECHAT_MINIPROGRAM_SECRET;
    console.log("[wxlogin/check] Config check:", {
      hasAppId: !!appId,
      appIdPrefix: appId ? appId.substring(0, 6) : "none",
      hasAppSecret: !!appSecret
    });

    if (!appId || !appSecret) {
      console.error("[wxlogin/check] Missing WeChat configuration");
      return NextResponse.json(
        {
          success: false,
          error: "CONFIG_ERROR",
          message: "WeChat mini program configuration missing",
        },
        { status: 500 }
      );
    }

    console.log("[wxlogin/check] Calling WeChat jscode2session API...");
    logInfo("WeChat check: exchanging code for session", { code });

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );

    const data = await response.json();
    console.log("[wxlogin/check] WeChat API response:", {
      hasError: !!data.errcode,
      errcode: data.errcode,
      errmsg: data.errmsg,
      hasOpenid: !!data.openid
    });

    if (data.errcode) {
      console.error("[wxlogin/check] WeChat API error:", data.errcode, data.errmsg);
      logSecurityEvent("wxlogin_check_failed", undefined, clientIP, {
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
    console.log("[wxlogin/check] Got openid successfully");

    logInfo("WeChat check: got openid", { openid });

    const app = getCloudBaseApp();
    const db = app.database();
    const usersCollection = db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS);

    let existingUser: any = null;
    let exists = false;
    let hasProfile = false;

    try {
      const queryResult = await usersCollection
        .where({
          wechat_miniprogram_openid: openid,
        })
        .limit(1)
        .get();

      if (queryResult.data && queryResult.data.length > 0) {
        existingUser = queryResult.data[0];
        exists = true;

        const userName = existingUser.name;
        const userAvatar = existingUser.avatar;

        hasProfile = !!(
          userName &&
          userName !== "小程序用户" &&
          userAvatar &&
          !userAvatar.includes("data:image/svg+xml")
        );

        logInfo("WeChat check: user found", {
          exists,
          hasProfile,
          userId: existingUser._id,
        });

        if (exists) {
          const now = new Date().toISOString();
          await usersCollection.doc(existingUser._id).update({
            wechat_session_key: sessionKey,
            login_count: (existingUser?.login_count || 0) + 1,
            last_login_at: now,
            last_login_ip: clientIP,
            updated_at: now,
          });

          const accessPayload = {
            userId: existingUser._id,
            email: existingUser.email,
            region: "CN",
          };

          const accessToken = jwt.sign(
            accessPayload,
            process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
            {
              expiresIn: "1h",
            }
          );

          await createRefreshToken({
            userId: existingUser._id,
            email: existingUser.email,
            deviceInfo: "wechat-miniprogram",
            ipAddress: clientIP,
            userAgent: request.headers.get("user-agent") || undefined,
          });

          const expiresIn = 7 * 24 * 60 * 60;

          return NextResponse.json({
            success: true,
            exists: true,
            hasProfile,
            token: accessToken,
            openid: openid,
            expiresIn: expiresIn,
            userName: userName || "小程序用户",
            userAvatar: userAvatar || null,
          });
        }
      }
    } catch (queryError) {
      logInfo("WeChat check: user not found", { openid });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      hasProfile: false,
      openid: openid,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("WeChat check error:", errorMessage);
    logSecurityEvent(
      "wxlogin_check_error",
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
        message: "WeChat check failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
