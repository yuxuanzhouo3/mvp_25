"use server";

/**
 * 管理后台 - 支付记录管理 Server Actions
 *
 * 提供支付记录列表、查看、统计等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  Payment,
  PaymentFilters,
  ApiResponse,
  PaginatedResult,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取支付记录列表
 */
export async function listPayments(
  filters?: PaymentFilters
): Promise<ApiResponse<PaginatedResult<Payment>>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const payments = await db.listPayments(filters || {});
    const total = await db.countPayments(filters || {});

    const pageSize = filters?.limit || 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;

    return {
      success: true,
      data: {
        items: payments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("获取支付记录失败:", error);
    return {
      success: false,
      error: error.message || "获取支付记录失败",
    };
  }
}

/**
 * 获取支付记录详情
 */
export async function getPaymentById(
  paymentId: string
): Promise<ApiResponse<Payment>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const payment = await db.getPaymentById(paymentId);

    if (!payment) {
      return {
        success: false,
        error: "支付记录不存在",
      };
    }

    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    console.error("获取支付详情失败:", error);
    return {
      success: false,
      error: error.message || "获取支付详情失败",
    };
  }
}

/**
 * 获取支付统计信息
 */
export async function getPaymentStats(): Promise<ApiResponse<{
  total: number;
  thisMonth: number;
  today: number;
  totalRevenue: number;
  byMethod: {
    wechat: number;
    alipay: number;
    stripe: number;
    paypal: number;
  };
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [total, thisMonth, today, allPayments] = await Promise.all([
      db.countPayments(),
      db.countPayments({ start_date: startOfMonth }),
      db.countPayments({ start_date: startOfDay }),
      db.listPayments({ limit: 10000 }), // 获取所有支付计算收入
    ]);

    // 计算总收入
    const totalRevenue = allPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // 按支付方式统计
    const byMethod = {
      wechat: allPayments
        .filter((p) => p.method === "wechat" && p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      alipay: allPayments
        .filter((p) => p.method === "alipay" && p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      stripe: allPayments
        .filter((p) => p.method === "stripe" && p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      paypal: allPayments
        .filter((p) => p.method === "paypal" && p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    };

    return {
      success: true,
      data: {
        total,
        thisMonth,
        today,
        totalRevenue,
        byMethod,
      },
    };
  } catch (error: any) {
    console.error("获取支付统计失败:", error);
    return {
      success: false,
      error: error.message || "获取支付统计失败",
    };
  }
}
