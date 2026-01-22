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
import { unstable_noStore } from "next/cache";

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
  // 禁用 Next.js 缓存，确保每次都获取最新数据
  unstable_noStore();

  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 获取所有支付记录
    const allPayments = await db.listPayments({ limit: 10000 });

    // 只统计已成功支付的订单（paid 状态）
    const paidPayments = allPayments.filter((p) => p.status === "paid");

    // 统计各时间段的支付数量
    const total = paidPayments.length;
    const thisMonth = paidPayments.filter(
      (p) => p.created_at && p.created_at >= startOfMonth
    ).length;
    const today = paidPayments.filter(
      (p) => p.created_at && p.created_at >= startOfDay
    ).length;

    // 计算总收入
    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 按支付方式统计
    const byMethod = {
      wechat: paidPayments
        .filter((p) => p.method === "wechat")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      alipay: paidPayments
        .filter((p) => p.method === "alipay")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      stripe: paidPayments
        .filter((p) => p.method === "stripe")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      paypal: paidPayments
        .filter((p) => p.method === "paypal")
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

/**
 * 获取支付趋势数据
 */
export async function getPaymentTrends(
  days: number = 30
): Promise<ApiResponse<{
  daily: Array<{ date: string; revenue: number; orders: number }>;
  todayRevenue: number;
  todayOrders: number;
}>> {
  unstable_noStore();

  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 获取所有支付记录
    const allPayments = await db.listPayments({ limit: 10000 });

    // 按日期聚合数据
    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    // 初始化每一天的数据
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { revenue: 0, orders: 0 });
    }

    let todayRevenue = 0;
    let todayOrders = 0;

    // 统计每日收入和订单数
    allPayments.forEach(payment => {
      if (payment.status === "paid" && payment.created_at) {
        const createdDate = new Date(payment.created_at).toISOString().split('T')[0];

        if (dailyMap.has(createdDate)) {
          const data = dailyMap.get(createdDate)!;
          data.revenue += payment.amount || 0;
          data.orders++;
        }

        // 统计今日数据
        if (payment.created_at >= startOfDay) {
          todayRevenue += payment.amount || 0;
          todayOrders++;
        }
      }
    });

    // 转换为数组
    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: date.substring(5), // 只显示 MM-DD
      revenue: Math.round(data.revenue * 100) / 100, // 保留两位小数
      orders: data.orders,
    }));

    return {
      success: true,
      data: {
        daily,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayOrders,
      },
    };
  } catch (error: any) {
    console.error("获取支付趋势失败:", error);
    return {
      success: false,
      error: error.message || "获取支付趋势失败",
    };
  }
}
