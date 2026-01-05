/**
 * Refresh Token 管理器
 * 负责 refresh token 的生成、验证、撤销
 */

import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { RefreshTokenRecord, CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";

function generateUUID(): string {
  return crypto.randomUUID();
}

interface CreateRefreshTokenOptions {
  userId: string;
  email: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateRefreshTokenResult {
  tokenId: string;
  refreshToken: string;
  userId: string;
  email: string;
}

/**
 * 生成并保存 refresh token
 */
export async function createRefreshToken(
  options: CreateRefreshTokenOptions
): Promise<CreateRefreshTokenResult | null> {
  try {
    const { userId, email, deviceInfo, ipAddress, userAgent } = options;

    const tokenId = generateUUID();

    const refreshToken = jwt.sign(
      { userId, tokenId },
      process.env.JWT_SECRET || "fallback-secret-key-for-development-only",
      { expiresIn: "7d" }
    );

    const db = getCloudBaseApp().database();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tokenRecord: RefreshTokenRecord = {
      tokenId,
      userId,
      email,
      refreshToken,
      deviceInfo,
      ipAddress,
      userAgent,
      isRevoked: false,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      usageCount: 0,
      region: "china",
    };

    await db
      .collection(CLOUDBASE_COLLECTIONS.REFRESH_TOKENS)
      .add(tokenRecord);

    console.log(
      `[Refresh Token Manager] Refresh token 已保存，tokenId: ${tokenId}, userId: ${userId}`
    );

    return {
      tokenId,
      refreshToken,
      userId,
      email,
    };
  } catch (error) {
    console.error("[Refresh Token Manager] 生成 refresh token 失败:", error);
    return null;
  }
}

interface VerifyRefreshTokenResult {
  valid: boolean;
  userId?: string;
  email?: string;
  tokenId?: string;
  error?: string;
}

/**
 * 验证 refresh token
 */
export async function verifyRefreshToken(
  token: string
): Promise<VerifyRefreshTokenResult> {
  try {
    let payload: any;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
      );
    } catch (error) {
      console.warn("[Refresh Token Manager] JWT 验证失败:", error);
      return {
        valid: false,
        error: "Invalid refresh token signature or expired",
      };
    }

    const { userId, tokenId } = payload;
    if (!userId || !tokenId) {
      return {
        valid: false,
        error: "Invalid refresh token payload",
      };
    }

    const db = getCloudBaseApp().database();
    const result = await db
      .collection(CLOUDBASE_COLLECTIONS.REFRESH_TOKENS)
      .where({
        tokenId,
        userId,
        isRevoked: false,
      })
      .get();

    if (!result.data || result.data.length === 0) {
      console.warn(
        `[Refresh Token Manager] Refresh token 已被撤销或不存在: tokenId=${tokenId}`
      );
      return {
        valid: false,
        error: "Refresh token has been revoked or not found",
      };
    }

    const tokenRecord = result.data[0];

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return {
        valid: false,
        error: "Refresh token has expired",
      };
    }

    await db
      .collection(CLOUDBASE_COLLECTIONS.REFRESH_TOKENS)
      .doc(tokenRecord._id)
      .update({
        lastUsedAt: new Date().toISOString(),
        usageCount: (tokenRecord.usageCount || 0) + 1,
      });

    console.log(
      `[Refresh Token Manager] Refresh token 验证成功: tokenId=${tokenId}`
    );

    return {
      valid: true,
      userId,
      email: tokenRecord.email,
      tokenId,
    };
  } catch (error) {
    console.error("[Refresh Token Manager] 验证 refresh token 失败:", error);
    return {
      valid: false,
      error: "Failed to verify refresh token",
    };
  }
}

/**
 * 撤销单个 refresh token
 */
export async function revokeRefreshToken(
  tokenId: string,
  reason?: string
): Promise<boolean> {
  try {
    const db = getCloudBaseApp().database();
    await db
      .collection(CLOUDBASE_COLLECTIONS.REFRESH_TOKENS)
      .where({ tokenId })
      .update({
        isRevoked: true,
        revokedAt: new Date().toISOString(),
        revokeReason: reason || "manual_revocation",
      });

    console.log(
      `[Refresh Token Manager] Refresh token 已撤销: tokenId=${tokenId}`
    );
    return true;
  } catch (error) {
    console.error("[Refresh Token Manager] 撤销 token 失败:", error);
    return false;
  }
}

/**
 * 撤销用户的所有 refresh tokens（登出时调用）
 */
export async function revokeAllUserTokens(
  userId: string,
  reason?: string
): Promise<{ success: boolean; revokedCount: number; error?: string }> {
  try {
    const db = getCloudBaseApp().database();
    const result = await db
      .collection(CLOUDBASE_COLLECTIONS.REFRESH_TOKENS)
      .where({
        userId,
        isRevoked: false,
      })
      .update({
        isRevoked: true,
        revokedAt: new Date().toISOString(),
        revokeReason: reason || "logout",
      });

    const revokedCount = result.updated || 0;
    console.log(
      `[Refresh Token Manager] 用户所有 refresh tokens 已撤销: userId=${userId}, count=${revokedCount}`
    );

    return {
      success: true,
      revokedCount,
    };
  } catch (error: any) {
    console.error("[Refresh Token Manager] 撤销用户所有 tokens 失败:", error);
    return {
      success: false,
      revokedCount: 0,
      error: error.message || "Failed to revoke tokens",
    };
  }
}
