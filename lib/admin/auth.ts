/**
 * 管理员认证系统
 *
 * 负责管理员登录、密码验证、权限检查等核心认证功能
 * 支持双数据库（CloudBase + Supabase）
 */

import bcrypt from "bcryptjs";
import { getDatabaseAdapter } from "./database";
import {
  setAdminSessionCookie,
  createAdminSession,
} from "./session";
import type {
  AdminUser,
  LoginCredentials,
  LoginResult,
} from "./types";

// ==================== 常量定义 ====================

/**
 * 密码最小长度
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * 密码复杂度正则表达式
 * 至少包含字母和数字
 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)/;

// ==================== 登录功能 ====================

/**
 * 管理员登录
 *
 * @param credentials - 登录凭证（用户名和密码）
 * @param ipAddress - IP 地址（用于日志记录）
 * @param userAgent - 用户代理（用于日志记录）
 * @returns 登录结果
 */
export async function adminLogin(
  credentials: LoginCredentials,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  const { username, password } = credentials;

  // 输入验证
  if (!username || !password) {
    return {
      success: false,
      error: "请输入用户名和密码",
    };
  }

  try {
    // 获取数据库适配器
    const db = await getDatabaseAdapter();

    // 查找管理员
    const admin = await db.getAdminByUsername(username);

    if (!admin) {
      // 记录失败的登录尝试
      await logFailedLoginAttempt(username, "user_not_found", ipAddress, userAgent);
      return {
        success: false,
        error: "用户名或密码错误",
      };
    }

    // 检查账户状态
    if (admin.status !== "active") {
      await logFailedLoginAttempt(username, "account_disabled", ipAddress, userAgent);
      return {
        success: false,
        error: "账户已被禁用，请联系管理员",
      };
    }

    // 获取密码（需要从数据库重新获取，因为 AdminUser 接口不包含密码）
    const adminWithPassword = await getAdminWithPassword(username);
    if (!adminWithPassword) {
      return {
        success: false,
        error: "用户名或密码错误",
      };
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, adminWithPassword.password_hash);

    if (!isPasswordValid) {
      await logFailedLoginAttempt(username, "invalid_password", ipAddress, userAgent);
      return {
        success: false,
        error: "用户名或密码错误",
      };
    }

    // 更新最后登录时间
    await db.updateAdmin(admin.id, {
      last_login_at: new Date().toISOString(),
    });

    // 创建会话
    const session = createAdminSession(admin.id, admin.username, admin.role);
    await setAdminSessionCookie(session);

    // 记录登录日志
    await db.createLog({
      admin_id: admin.id,
      admin_username: admin.username,
      action: "admin.login",
      resource_type: "admin",
      resource_id: admin.id,
      details: { login_method: "password" },
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "success",
    });

    return {
      success: true,
      admin: {
        ...admin,
        last_login_at: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("管理员登录失败:", error);
    return {
      success: false,
      error: "登录过程中发生错误，请稍后重试",
    };
  }
}

/**
 * 管理员登出
 *
 * @param adminId - 管理员 ID
 */
export async function adminLogout(adminId: string): Promise<void> {
  try {
    const db = await getDatabaseAdapter();

    // 获取管理员信息
    const admin = await db.getAdminById(adminId);

    if (admin) {
      // 记录登出日志
      await db.createLog({
        admin_id: admin.id,
        admin_username: admin.username,
        action: "admin.logout",
        resource_type: "admin",
        resource_id: admin.id,
        details: {},
        status: "success",
      });
    }

    // 清除会话 Cookie
    const { clearAdminSessionCookie } = await import("./session");
    await clearAdminSessionCookie();
  } catch (error) {
    console.error("管理员登出失败:", error);
    // 即使记录日志失败，也要清除 Cookie
    const { clearAdminSessionCookie } = await import("./session");
    await clearAdminSessionCookie();
  }
}

// ==================== 密码管理 ====================

/**
 * 哈希密码
 *
 * @param password - 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * 验证密码强度
 *
 * @param password - 密码
 * @returns 验证结果
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`密码长度至少为 ${MIN_PASSWORD_LENGTH} 位`);
  }

  if (!PASSWORD_REGEX.test(password)) {
    errors.push("密码必须包含字母和数字");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 修改密码
 *
 * @param adminId - 管理员 ID
 * @param oldPassword - 旧密码
 * @param newPassword - 新密码
 * @returns 修改结果
 */
export async function changePassword(
  adminId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // 验证新密码强度
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    return {
      success: false,
      error: passwordValidation.errors.join("；"),
    };
  }

  try {
    const db = await getDatabaseAdapter();

    // 获取当前管理员
    const admin = await db.getAdminById(adminId);
    if (!admin) {
      return {
        success: false,
        error: "管理员不存在",
      };
    }

    // 获取密码
    const adminWithPassword = await getAdminWithPassword(admin.username);
    if (!adminWithPassword) {
      return {
        success: false,
        error: "管理员不存在",
      };
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, adminWithPassword.password_hash);

    if (!isOldPasswordValid) {
      return {
        success: false,
        error: "旧密码错误",
      };
    }

    // 更新密码
    await db.updateAdmin(adminId, {
      password: newPassword,
    });

    // 记录日志
    await db.createLog({
      admin_id: adminId,
      admin_username: admin.username,
      action: "admin.update",
      resource_type: "admin",
      resource_id: adminId,
      details: { action: "change_password" },
      status: "success",
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("修改密码失败:", error);
    return {
      success: false,
      error: "修改密码失败，请稍后重试",
    };
  }
}

// ==================== 权限检查 ====================

/**
 * 检查是否有超级管理员权限
 *
 * @param adminId - 管理员 ID
 * @returns 是否是超级管理员
 */
export async function isSuperAdmin(adminId: string): Promise<boolean> {
  try {
    const db = await getDatabaseAdapter();
    const admin = await db.getAdminById(adminId);
    return admin?.role === "super_admin";
  } catch {
    return false;
  }
}

/**
 * 要求超级管理员权限
 * 如果不是超级管理员，抛出错误
 *
 * @param adminId - 管理员 ID
 * @throws 如果不是超级管理员
 */
export async function requireSuperAdmin(adminId: string): Promise<void> {
  const hasPermission = await isSuperAdmin(adminId);
  if (!hasPermission) {
    throw new Error("需要超级管理员权限");
  }
}

// ==================== 辅助函数 ====================

/**
 * 获取包含密码的管理员信息（内部使用）
 *
 * 注意：此函数返回包含明文密码哈希的对象，仅用于密码验证
 *
 * @param username - 用户名
 * @returns 包含密码的管理员对象或 null
 */
async function getAdminWithPassword(
  username: string
): Promise<{ id: string; username: string; password_hash: string; role: string; status: string } | null> {
  // 查询两个数据库以支持双数据库架构
  try {
    // CloudBase 查询
    const { getCloudBaseDatabase } = await import("@/lib/cloudbase/init");
    const database = getCloudBaseDatabase();

    const cloudbaseResult = await database
      .collection("admin_users")
      .where({ username })
      .field({ id: true, username: true, password_hash: true, role: true, status: true })
      .get();

    if (cloudbaseResult.data.length > 0) {
      return {
        id: cloudbaseResult.data[0]._id,
        username: cloudbaseResult.data[0].username,
        password_hash: cloudbaseResult.data[0].password_hash,
        role: cloudbaseResult.data[0].role,
        status: cloudbaseResult.data[0].status,
      };
    }
  } catch (error) {
    console.error("CloudBase 查询失败:", error);
  }

  // Supabase 查询（作为后备或并行查询）
  try {
    const { getSupabaseAdmin } = await import("@/lib/integrations/supabase-admin");
    const supabase = getSupabaseAdmin();

    const result = await supabase
      .from("admin_users")
      .select("id, username, password_hash, role, status")
      .eq("username", username)
      .single();

    if (result.data && !result.error) {
      return result.data;
    }
  } catch (error) {
    console.error("Supabase 查询失败:", error);
  }

  return null;
}

/**
 * 记录失败的登录尝试
 *
 * @param username - 用户名
 * @param reason - 失败原因
 * @param ipAddress - IP 地址
 * @param userAgent - 用户代理
 */
async function logFailedLoginAttempt(
  username: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const db = await getDatabaseAdapter();

    await db.createLog({
      admin_id: "00000000-0000-0000-0000-000000000000", // 系统日志的默认 UUID
      admin_username: username,
      action: "admin.login",
      resource_type: "admin",
      details: {
        reason,
        attempt_type: "failed_login",
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status: "failure",
      error_message: reason,
    });
  } catch (error) {
    console.error("记录失败登录尝试失败:", error);
  }
}
