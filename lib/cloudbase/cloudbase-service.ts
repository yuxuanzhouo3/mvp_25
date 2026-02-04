/**
 * CloudBase 认证服务
 * 提供登录、注册功能
 */

import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { createRefreshToken } from "@/lib/auth/refresh-token-manager";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";

/**
 * 从 token 中提取用户 ID
 */
export function extractUserIdFromToken(token: string): string | null {
  if (!token) {
    console.error("[CloudBase Service] 无效的 token");
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("[CloudBase Service] Token 格式错误");
      return null;
    }

    const payload = parts[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    const claims = JSON.parse(decoded);

    const userId = claims.userId || claims.uid || claims.sub || claims.user_id;
    if (!userId) {
      console.error("[CloudBase Service] Token 中找不到 userId");
      return null;
    }

    return userId;
  } catch (error) {
    console.error("[CloudBase Service] Token 解码失败:", error);
    return null;
  }
}

/**
 * 用户登录
 */
export async function loginUser(
  email: string,
  password: string,
  options?: { deviceInfo?: string; ipAddress?: string; userAgent?: string }
): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  name?: string;
  pro?: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  membership_expires_at?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenMeta?: { accessTokenExpiresIn: number; refreshTokenExpiresIn: number };
  error?: string;
}> {
  try {
    console.log("[CloudBase Service] 开始登录，邮箱:", email);

    const app = getCloudBaseApp();
    const db = app.database();
    const usersCollection = db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS);

    const userResult = await usersCollection.where({ email }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return {
        success: false,
        error: "用户不存在或密码错误",
      };
    }

    const user = userResult.data[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        error: "用户不存在或密码错误",
      };
    }

    console.log("[CloudBase Service] 登录成功");

    // 检查订阅是否过期
    if (user.pro) {
      const { data: subs } = await db
        .collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS)
        .where({ user_id: user._id })
        .orderBy("created_at", "desc")
        .limit(1)
        .get();

      if (subs && subs.length > 0) {
        const sub = subs[0];
        const endDate = new Date(sub.end_date);
        const isExpired = endDate < new Date();

        if (isExpired && user.pro) {
          const now = new Date().toISOString();

          // 更新用户的 pro 状态
          await usersCollection.doc(user._id).update({
            pro: false,
            subscription_status: "expired",
            updated_at: now,
          });

          user.pro = false;
          user.subscription_status = "expired";
        }
      }
    }

    const tokenPayload = {
      userId: user._id,
      email: user.email,
      region: "china",
    };

    // 生成短期 Access Token (1小时)
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
      { expiresIn: "1h" }
    );

    // 生成并保存长期 Refresh Token (7天)
    const refreshTokenRecord = await createRefreshToken({
      userId: user._id,
      email: user.email,
      deviceInfo: options?.deviceInfo,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    if (!refreshTokenRecord) {
      return {
        success: false,
        error: "无法生成 refresh token",
      };
    }

    // 更新用户登录信息
    const updateResult = await usersCollection.doc(user._id).update({
      last_login_at: new Date().toISOString(),
      last_login_ip: options?.ipAddress,
      login_count: (user.login_count || 0) + 1,
    });

    console.log("[CloudBase Service] ✅ 登录信息更新结果:", updateResult);
    console.log("[CloudBase Service] 用户ID:", user._id, "| last_login_at:", new Date().toISOString());

    return {
      success: true,
      userId: user._id,
      email: user.email,
      name: user.name,
      pro: user.pro,
      subscription_plan: user.subscription_plan,
      subscription_status: user.subscription_status,
      membership_expires_at: user.membership_expires_at,
      accessToken,
      refreshToken: refreshTokenRecord.refreshToken,
      tokenMeta: {
        accessTokenExpiresIn: 3600,
        refreshTokenExpiresIn: 604800,
      },
    };
  } catch (error: any) {
    console.error("[CloudBase Service] 登录失败:", error);
    return {
      success: false,
      error: error.message || "登录失败",
    };
  }
}

/**
 * 用户注册
 */
export async function signupUser(
  email: string,
  password: string,
  name?: string,
  options?: { deviceInfo?: string; ipAddress?: string; userAgent?: string }
): Promise<{
  success: boolean;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenMeta?: { accessTokenExpiresIn: number; refreshTokenExpiresIn: number };
  error?: string;
}> {
  try {
    console.log("[CloudBase Service] 开始注册，邮箱:", email);

    const app = getCloudBaseApp();
    const db = app.database();
    const usersCollection = db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS);

    // 检查邮箱是否已存在
    const existingUserResult = await usersCollection.where({ email }).get();

    if (existingUserResult.data && existingUserResult.data.length > 0) {
      return {
        success: false,
        error: "该邮箱已被注册",
      };
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 生成默认头像 (基于用户名首字母的 SVG)
    const displayName = name || email.split("@")[0];
    const initial = displayName.charAt(0).toUpperCase();
    const colors = [
      "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
      "#f43f5e", "#ef4444", "#f97316", "#eab308", "#22c55e",
      "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1"
    ];
    const colorIndex = email.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    const defaultAvatar = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bgColor}"/>
        <text x="50" y="50" font-family="Arial,sans-serif" font-size="45" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initial}</text>
      </svg>`
    )}`;

    // 创建用户
    const newUser = {
      email,
      password: hashedPassword,
      name: displayName,
      avatar: defaultAvatar,
      pro: false,
      subscription_plan: "free",
      subscription_status: "active",
      region: "china",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      login_count: 1,
    };

    const result = await usersCollection.add(newUser);

    console.log("[CloudBase Service] 注册成功");

    const tokenPayload = {
      userId: result.id,
      email,
      region: "china",
    };

    // 生成 accessToken
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
      { expiresIn: "1h" }
    );

    // 生成 refreshToken
    const refreshTokenRecord = await createRefreshToken({
      userId: result.id,
      email,
      deviceInfo: options?.deviceInfo || "web-signup",
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    if (!refreshTokenRecord) {
      console.warn("[CloudBase Service] 生成 refresh token 失败");
      return {
        success: true,
        userId: result.id,
        accessToken,
        refreshToken: undefined,
        tokenMeta: {
          accessTokenExpiresIn: 3600,
          refreshTokenExpiresIn: 0,
        },
      };
    }

    return {
      success: true,
      userId: result.id,
      accessToken,
      refreshToken: refreshTokenRecord.refreshToken,
      tokenMeta: {
        accessTokenExpiresIn: 3600,
        refreshTokenExpiresIn: 604800,
      },
    };
  } catch (error: any) {
    console.error("[CloudBase Service] 注册失败:", error);
    return {
      success: false,
      error: error.message || "注册失败",
    };
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase() {
  const app = getCloudBaseApp();
  return app.database();
}

/**
 * 验证 JWT Token
 */
export function verifyJwtToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
    );
    return { valid: true, payload };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * 根据用户 ID 获取用户信息
 */
export async function getUserById(userId: string) {
  try {
    const db = getCloudBaseApp().database();
    const result = await db
      .collection(CLOUDBASE_COLLECTIONS.WEB_USERS)
      .doc(userId)
      .get();

    if (!result.data || result.data.length === 0) {
      return null;
    }

    const user = result.data[0] || result.data;
    // 不返回密码
    const { password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error("[CloudBase Service] 获取用户信息失败:", error);
    return null;
  }
}
