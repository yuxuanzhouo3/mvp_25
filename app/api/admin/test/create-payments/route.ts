/**
 * 创建测试支付记录的 API 端点
 *
 * 用法：POST /api/admin/test/create-payments
 * 需要管理员权限
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/session";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await requireAdminSession();

    const supabase = getSupabaseAdmin();

    // 测试支付数据
    const testPayments = [
      {
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        payment_id: "pi_test_stripe_001",
        provider: "stripe",
        amount: 29.99,
        currency: "USD",
        status: "paid",
        metadata: { product: "pro_monthly", description: "Pro Monthly Plan" },
        created_at: new Date().toISOString()
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440002",
        payment_id: "pi_test_stripe_002",
        provider: "stripe",
        amount: 99.00,
        currency: "USD",
        status: "paid",
        metadata: { product: "pro_yearly", description: "Pro Yearly Plan" },
        created_at: new Date(Date.now() - 86400000).toISOString() // 1天前
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440003",
        payment_id: "pi_test_paypal_001",
        provider: "paypal",
        amount: 49.99,
        currency: "USD",
        status: "paid",
        metadata: { product: "pro_quarterly", description: "Pro Quarterly Plan" },
        created_at: new Date(Date.now() - 172800000).toISOString() // 2天前
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440004",
        payment_id: "wx_test_wechat_001",
        provider: "wechat",
        amount: 199.00,
        currency: "CNY",
        status: "paid",
        metadata: { product: "enterprise", description: "Enterprise Plan" },
        created_at: new Date(Date.now() - 259200000).toISOString() // 3天前
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440005",
        payment_id: "ali_test_alipay_001",
        provider: "alipay",
        amount: 299.00,
        currency: "CNY",
        status: "paid",
        metadata: { product: "enterprise_yearly", description: "Enterprise Yearly Plan" },
        created_at: new Date(Date.now() - 432000000).toISOString() // 5天前
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440006",
        payment_id: "pi_test_stripe_003",
        provider: "stripe",
        amount: 199.00,
        currency: "USD",
        status: "paid",
        metadata: { product: "enterprise", description: "Enterprise Plan (Intl)" },
        created_at: new Date(Date.now() - 600000000).toISOString() // 7天前
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440007",
        payment_id: "pi_test_stripe_004",
        provider: "stripe",
        amount: 9.99,
        currency: "USD",
        status: "pending",
        metadata: { product: "pro_monthly", description: "Pro Monthly (Pending)" },
        created_at: new Date(Date.now() - 3600000).toISOString() // 1小时前
      },
      {
        user_id: "550e8400-e29b-41d4-a716-446655440008",
        payment_id: "wx_test_wechat_002",
        provider: "wechat",
        amount: 99.00,
        currency: "CNY",
        status: "paid",
        metadata: { product: "pro_yearly", description: "Pro Yearly (CN)" },
        created_at: new Date(Date.now() - 86400000 * 10).toISOString() // 10天前
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

    return NextResponse.json({
      success: true,
      message: `创建完成：成功 ${successCount} 条，失败 ${failCount} 条`,
      results,
      summary: {
        total: testPayments.length,
        success: successCount,
        failed: failCount,
        stripe: testPayments.filter(p => p.provider === 'stripe').length,
        paypal: testPayments.filter(p => p.provider === 'paypal').length,
        wechat: testPayments.filter(p => p.provider === 'wechat').length,
        alipay: testPayments.filter(p => p.provider === 'alipay').length,
        totalUSD: testPayments.filter(p => p.currency === 'USD' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        totalCNY: testPayments.filter(p => p.currency === 'CNY' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
      }
    });

  } catch (error: any) {
    console.error("创建测试支付失败:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "创建失败"
    }, { status: 500 });
  }
}
