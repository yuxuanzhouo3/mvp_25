/**
 * PayPal Webhook 处理
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhook } from "@/lib/payment/providers/paypal-provider";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transmissionId = request.headers.get("paypal-transmission-id");
    const transmissionSig = request.headers.get("paypal-transmission-sig");
    const transmissionTime = request.headers.get("paypal-transmission-time");
    const certUrl = request.headers.get("paypal-cert-url");

    if (\!transmissionId || \!transmissionSig || \!transmissionTime || \!certUrl) {
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const isValid = await verifyPayPalWebhook(
      body,
      transmissionId,
      transmissionSig,
      transmissionTime,
      certUrl
    );

    if (\!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 检查是否已处理
    const existing = await supabase
      .from("webhook_events")
      .select("id")
      .eq("event_id", transmissionId)
      .single();

    if (existing.data) {
      return NextResponse.json({ received: true });
    }

    // 记录事件
    await supabase.from("webhook_events").insert({
      provider: "paypal",
      event_id: transmissionId,
      event_type: body.event_type,
      processed: true,
    });

    // 处理事件
    if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const customId = JSON.parse(body.resource.custom_id || "{}");
      const userId = customId.userId;
      const days = customId.days || 0;

      if (userId && days > 0) {
        await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("payment_id", body.resource.id);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          plan_type: customId.paymentType,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
