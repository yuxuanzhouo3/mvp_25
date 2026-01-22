"use server";

/**
 * 管理后台 - 测试数据 Server Actions
 *
 * 提供创建测试数据的功能，用于开发测试
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";
import type { ApiResponse } from "@/lib/admin/types";

/**
 * 创建测试支付记录 - 仅国际支付（Stripe + PayPal）
 * 数据存储在 Supabase
 */
export async function createTestPayments(): Promise<ApiResponse<{
  created: number;
  failed: number;
  details: any[];
  summary: any;
}>> {
  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    // 获取真实的用户ID（从profiles表）
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .limit(10);

    if (profilesError || !profiles || profiles.length === 0) {
      return {
        success: false,
        error: "无法获取用户数据，请先创建用户"
      };
    }

    // 使用真实用户ID，循环使用以确保每个支付都有对应的用户
    const getUserID = (index: number) => profiles[index % profiles.length].id;

    // 仅国际支付测试数据（Stripe + PayPal）
    const testPayments = [
      {
        user_id: getUserID(0),
        payment_id: "pi_test_stripe_001",
        provider: "stripe",
        amount: 29.99,
        currency: "USD",
        status: "paid",
        metadata: { product: "pro_monthly", description: "Pro Monthly Plan", test: true, region: "intl" },
        created_at: new Date().toISOString()
      },
      {
        user_id: getUserID(1),
        payment_id: "pi_test_stripe_002",
        provider: "stripe",
        amount: 99.00,
        currency: "USD",
        status: "paid",
        metadata: { product: "pro_yearly", description: "Pro Yearly Plan", test: true, region: "intl" },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        user_id: getUserID(2),
        payment_id: "pi_test_paypal_001",
        provider: "paypal",
        amount: 49.99,
        currency: "USD",
        status: "paid",
        metadata: { product: "pro_quarterly", description: "Pro Quarterly Plan", test: true, region: "intl" },
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        user_id: getUserID(3),
        payment_id: "pi_test_stripe_003",
        provider: "stripe",
        amount: 199.00,
        currency: "USD",
        status: "paid",
        metadata: { product: "enterprise", description: "Enterprise Plan (Intl)", test: true, region: "intl" },
        created_at: new Date(Date.now() - 600000000).toISOString()
      },
      {
        user_id: getUserID(4),
        payment_id: "pi_test_stripe_004",
        provider: "stripe",
        amount: 9.99,
        currency: "USD",
        status: "pending",
        metadata: { product: "pro_monthly", description: "Pro Monthly (Pending)", test: true, region: "intl" },
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const payment of testPayments) {
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select();

      if (error) {
        failCount++;
        results.push({
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: "failed",
          error: error.message
        });
      } else {
        successCount++;
        results.push({
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: "success",
          id: data?.[0]?.id
        });
      }
    }

    const summary = {
      total: testPayments.length,
      success: successCount,
      failed: failCount,
      stripe: testPayments.filter(p => p.provider === 'stripe').length,
      paypal: testPayments.filter(p => p.provider === 'paypal').length,
      wechat: 0, // 国际支付不包含微信
      alipay: 0, // 国际支付不包含支付宝
      totalUSD: testPayments.filter(p => p.currency === 'USD' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalCNY: 0 // 国际支付不包含 CNY
    };

    return {
      success: true,
      data: {
        created: successCount,
        failed: failCount,
        details: results,
        summary
      }
    };

  } catch (error: any) {
    console.error("创建测试支付失败:", error);
    return {
      success: false,
      error: error.message || "创建测试支付失败"
    };
  }
}

/**
 * 删除所有测试数据
 */
export async function deleteTestData(): Promise<ApiResponse<{ deleted: number }>> {
  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    // 删除 Supabase 中的测试支付记录（通过 metadata.test 标识）
    const { data, error } = await supabase
      .from("payments")
      .delete()
      .not("metadata", "is", null)
      .select("id");

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: {
        deleted: data?.length || 0
      }
    };

  } catch (error: any) {
    console.error("删除测试数据失败:", error);
    return {
      success: false,
      error: error.message || "删除测试数据失败"
    };
  }
}

/**
 * 创建测试支付记录 - 仅国内支付（WeChat + Alipay）
 * 数据存储在 CloudBase
 *
 * 注意：需要先登录 CloudBase 才能使用此函数
 */
export async function createTestPaymentsCN(): Promise<ApiResponse<{
  created: number;
  failed: number;
  details: any[];
  summary: any;
}>> {
  try {
    const session = await requireAdminSession();

    // 导入 CloudBase
    const { getCloudBaseDatabase } = await import("@/lib/cloudbase/init");
    const database = getCloudBaseDatabase();

    // 获取真实的用户ID（从 web_users 表，CloudBase 使用 web_users 而不是 profiles）
    const profilesResult = await database
      .collection("web_users")
      .field({ _id: true })
      .limit(10)
      .get();

    if (!profilesResult.data || profilesResult.data.length === 0) {
      return {
        success: false,
        error: "CloudBase 中无用户数据，请先创建用户"
      };
    }

    const profiles = profilesResult.data;
    const getUserID = (index: number) => profiles[index % profiles.length]._id;

    // 国内支付测试数据（WeChat + Alipay）
    const testPayments = [
      {
        user_id: getUserID(0),
        payment_id: "wx_test_wechat_001",
        provider: "wechat",
        payment_method: "wechat", // CloudBase 适配器期望 payment_method 字段
        amount: 199.00,
        currency: "CNY",
        status: "paid",
        metadata: { product: "enterprise", description: "Enterprise Plan", test: true, region: "cn" },
        created_at: new Date().toISOString()
      },
      {
        user_id: getUserID(1),
        payment_id: "ali_test_alipay_001",
        provider: "alipay",
        payment_method: "alipay", // CloudBase 适配器期望 payment_method 字段
        amount: 299.00,
        currency: "CNY",
        status: "paid",
        metadata: { product: "enterprise_yearly", description: "Enterprise Yearly Plan", test: true, region: "cn" },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        user_id: getUserID(2),
        payment_id: "wx_test_wechat_002",
        provider: "wechat",
        payment_method: "wechat", // CloudBase 适配器期望 payment_method 字段
        amount: 99.00,
        currency: "CNY",
        status: "paid",
        metadata: { product: "pro_yearly", description: "Pro Yearly (CN)", test: true, region: "cn" },
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const payment of testPayments) {
      try {
        const result = await database
          .collection("payments")
          .add(payment);

        successCount++;
        results.push({
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: "success",
          id: result.id
        });
      } catch (error: any) {
        failCount++;
        results.push({
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: "failed",
          error: error.message
        });
      }
    }

    const summary = {
      total: testPayments.length,
      success: successCount,
      failed: failCount,
      stripe: 0, // 国内支付不包含 Stripe
      paypal: 0, // 国内支付不包含 PayPal
      wechat: testPayments.filter(p => p.provider === 'wechat').length,
      alipay: testPayments.filter(p => p.provider === 'alipay').length,
      totalUSD: 0, // 国内支付不包含 USD
      totalCNY: testPayments.filter(p => p.currency === 'CNY' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    };

    return {
      success: true,
      data: {
        created: successCount,
        failed: failCount,
        details: results,
        summary
      }
    };

  } catch (error: any) {
    console.error("创建国内测试支付失败:", error);
    return {
      success: false,
      error: error.message || "创建国内测试支付失败"
    };
  }
}
