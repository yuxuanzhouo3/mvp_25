"use server";

/**
 * 管理后台 - 用户管理 Server Actions
 *
 * 提供用户列表、查看、编辑、禁用等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  User,
  UserFilters,
  ApiResponse,
  PaginatedResult,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取用户列表
 */
export async function listUsers(
  filters?: UserFilters
): Promise<ApiResponse<PaginatedResult<User>>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const users = await db.listUsers(filters || {});
    const total = await db.countUsers(filters || {});

    const pageSize = filters?.limit || 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;

    return {
      success: true,
      data: {
        items: users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("获取用户列表失败:", error);
    return {
      success: false,
      error: error.message || "获取用户列表失败",
    };
  }
}

/**
 * 获取单个用户详情
 */
export async function getUserById(
  userId: string
): Promise<ApiResponse<User>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const user = await db.getUserById(userId);

    if (!user) {
      return {
        success: false,
        error: "用户不存在",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    console.error("获取用户详情失败:", error);
    return {
      success: false,
      error: error.message || "获取用户详情失败",
    };
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(
  userId: string,
  updates: {
    name?: string;
    role?: "free" | "pro" | "enterprise";
    status?: "active" | "disabled" | "banned";
    subscription_plan?: "free" | "pro" | "enterprise";
    pro_expires_at?: string | null;
  }
): Promise<ApiResponse<User>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const updatedUser = await db.updateUser(userId, updates);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "user.update",
      resource_type: "user",
      resource_id: userId,
      details: { updates },
      status: "success",
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error: any) {
    console.error("更新用户失败:", error);
    return {
      success: false,
      error: error.message || "更新用户失败",
    };
  }
}

/**
 * 禁用用户
 */
export async function disableUser(
  userId: string
): Promise<ApiResponse<User>> {
  return updateUser(userId, { status: "disabled" });
}

/**
 * 启用用户
 */
export async function enableUser(
  userId: string
): Promise<ApiResponse<User>> {
  return updateUser(userId, { status: "active" });
}

/**
 * 删除用户
 */
export async function deleteUser(
  userId: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    await db.deleteUser(userId);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "user.delete",
      resource_type: "user",
      resource_id: userId,
      details: {},
      status: "success",
    });

    revalidatePath("/admin/users");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除用户失败:", error);
    return {
      success: false,
      error: error.message || "删除用户失败",
    };
  }
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(): Promise<ApiResponse<{
  total: number;
  free: number;
  pro: number;
  enterprise: number;
  newThisMonth: number;
  newToday: number;
  activeThisWeek: number;
  monthlyActive: number;
  dailyActive: number;
  paidUsers: number;
  conversionRate: number;
  byRegion: {
    domestic: number;
    international: number;
  };
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 获取所有用户进行统计
    const allUsers = await db.listUsers({ limit: 10000 });

    // 在内存中统计
    const free = allUsers.filter(u =>
      !u.subscription_plan || u.subscription_plan === "free"
    ).length;

    const pro = allUsers.filter(u =>
      u.subscription_plan === "yearly" || u.subscription_plan === "monthly"
    ).length;

    const enterprise = allUsers.filter(u =>
      u.subscription_plan === "enterprise"
    ).length;

    const newThisMonth = allUsers.filter(u =>
      u.created_at >= startOfMonth
    ).length;

    const newToday = allUsers.filter(u =>
      u.created_at >= startOfDay
    ).length;

    const activeThisWeek = allUsers.filter(u =>
      u.last_login_at && u.last_login_at >= startOfWeek
    ).length;

    const monthlyActive = allUsers.filter(u =>
      u.last_login_at && u.last_login_at >= startOfMonthAgo
    ).length;

    const dailyActive = allUsers.filter(u =>
      u.last_login_at && u.last_login_at >= startOfDay
    ).length;

    const paidUsers = pro + enterprise;
    const conversionRate = allUsers.length > 0
      ? (paidUsers / allUsers.length) * 100
      : 0;

    // 按地区统计（国内 vs 国际）
    const domestic = allUsers.filter(u =>
      !u.region || u.region === 'CN' || u.region === 'china'
    ).length;

    const international = allUsers.length - domestic;

    return {
      success: true,
      data: {
        total: allUsers.length,
        free,
        pro,
        enterprise,
        newThisMonth,
        newToday,
        activeThisWeek,
        monthlyActive,
        dailyActive,
        paidUsers,
        conversionRate: Math.round(conversionRate * 10) / 10, // 保留一位小数
        byRegion: {
          domestic,
          international,
        },
      },
    };
  } catch (error: any) {
    console.error("获取用户统计失败:", error);
    return {
      success: false,
      error: error.message || "获取用户统计失败",
    };
  }
}

/**
 * 获取用户趋势数据
 */
export async function getUserTrends(
  days: number = 30
): Promise<ApiResponse<{
  daily: Array<{ date: string; newUsers: number; activeUsers: number }>;
  byRegion: {
    domestic: number;
    international: number;
  };
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 获取所有用户
    const allUsers = await db.listUsers({ limit: 10000 });

    // 按日期聚合数据
    const dailyMap = new Map<string, { newUsers: number; activeUsers: number }>();

    // 初始化每一天的数据
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { newUsers: 0, activeUsers: 0 });
    }

    // 统计每日新增用户
    allUsers.forEach(user => {
      if (user.created_at) {
        const createdDate = new Date(user.created_at).toISOString().split('T')[0];
        if (dailyMap.has(createdDate)) {
          const data = dailyMap.get(createdDate)!;
          data.newUsers++;
        }
      }
    });

    // 统计每日活跃用户
    allUsers.forEach(user => {
      if (user.last_login_at) {
        const lastLoginDate = new Date(user.last_login_at).toISOString().split('T')[0];
        if (dailyMap.has(lastLoginDate)) {
          const data = dailyMap.get(lastLoginDate)!;
          data.activeUsers++;
        }
      }
    });

    // 转换为数组
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: date.substring(5), // 只显示 MM-DD
      ...data,
    }));

    // 按地区统计
    const domestic = allUsers.filter(u =>
      !u.region || u.region === 'CN' || u.region === 'china'
    ).length;

    const international = allUsers.length - domestic;

    return {
      success: true,
      data: {
        daily,
        byRegion: {
          domestic,
          international,
        },
      },
    };
  } catch (error: any) {
    console.error("获取用户趋势失败:", error);
    return {
      success: false,
      error: error.message || "获取用户趋势失败",
    };
  }
}
