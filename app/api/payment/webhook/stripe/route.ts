/**
 * Stripe Webhook 处理
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "@/lib/payment/providers/stripe-provider";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const event = verifyStripeWebhook(body, signature);

    if (!event) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 处理不同类型的事件
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const days = parseInt(session.metadata?.days || "0");

      if (userId && days > 0) {
        // 更新支付状态
        await supabase
          .from("payments")
          .update({ status: "paid" })
          .eq("payment_id", session.id);

        // 延长订阅
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          plan_type: session.metadata?.paymentType,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
