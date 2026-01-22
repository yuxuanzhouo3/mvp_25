/**
 * 创建测试支付记录的脚本
 *
 * 用法：npx tsx scripts/create-test-payments.ts
 */

import { getSupabaseAdmin } from "../lib/integrations/supabase-admin";

async function createTestPayments() {
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

  console.log("🚀 开始创建测试支付记录...\n");

  for (const payment of testPayments) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select();

      if (error) {
        console.error(`❌ 插入失败 [${payment.provider}]:`, error.message);
      } else {
        console.log(`✅ 插入成功: ${payment.provider.toUpperCase()} - ${payment.amount} ${payment.currency}`);
        console.log(`   Payment ID: ${payment.payment_id}`);
        console.log(`   DB ID: ${data?.[0]?.id}\n`);
      }
    } catch (err: any) {
      console.error(`❌ 插入异常 [${payment.provider}]:`, err.message);
    }
  }

  console.log("\n📊 统计信息：");
  console.log("- 尝试插入:", testPayments.length);
  console.log("- Stripe:", testPayments.filter(p => p.provider === 'stripe').length);
  console.log("- PayPal:", testPayments.filter(p => p.provider === 'paypal').length);
  console.log("- WeChat:", testPayments.filter(p => p.provider === 'wechat').length);
  console.log("- Alipay:", testPayments.filter(p => p.provider === 'alipay').length);
  console.log("- 总金额(USD):", testPayments.filter(p => p.currency === 'USD' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0));
  console.log("- 总金额(CNY):", testPayments.filter(p => p.currency === 'CNY' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0));

  console.log("\n✨ 测试数据创建完成！");
}

createTestPayments().catch(console.error);
