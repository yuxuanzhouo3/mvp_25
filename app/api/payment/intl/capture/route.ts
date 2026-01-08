/**
 * PayPal 订单 Capture API
 * 用于在用户完成PayPal支付授权后capture订单并激活会员
 */

import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/payment/providers/paypal-provider";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { provider, token } = await request.json();

    if (provider !== "paypal" || !token) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    console.log("[PayPal Capture] Starting capture for token:", token);

    // 1. Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    if (!accessToken) {
      console.error("[PayPal Capture] Failed to get access token");
      return NextResponse.json(
        { error: "Failed to get PayPal access token" },
        { status: 500 }
      );
    }

    // 2. Capture the order
    const baseUrl =
      process.env.PAYPAL_SANDBOX === "true"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

    const captureResponse = await fetch(
      `${baseUrl}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error("[PayPal Capture] Capture failed:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to capture PayPal order" },
        { status: 500 }
      );
    }

    const captureData = await captureResponse.json();
    console.log("[PayPal Capture] Capture successful:", captureData.id);
    console.log("[PayPal Capture] Full capture response:", JSON.stringify(captureData, null, 2));

    // 3. Parse user info from custom_id
    // PayPal may return custom_id in different locations depending on the response structure
    let customIdStr = captureData.purchase_units?.[0]?.custom_id;

    // If not found at top level, try from captures array
    if (!customIdStr) {
      customIdStr = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    }

    // Initialize supabase early for fallback lookup
    const supabase = getSupabaseAdmin();

    // If still not found, try to get from database using the payment_id (token)
    if (!customIdStr) {
      console.log("[PayPal Capture] custom_id not in response, checking database for token:", token);
      const { data: paymentRecord } = await supabase
        .from("payments")
        .select("metadata")
        .eq("payment_id", token)
        .single();

      if (paymentRecord?.metadata) {
        customIdStr = JSON.stringify(paymentRecord.metadata);
        console.log("[PayPal Capture] Found metadata in database:", customIdStr);
      }
    }

    if (!customIdStr) {
      console.error("[PayPal Capture] No custom_id found in order or database");
      return NextResponse.json(
        { error: "Missing user information in order" },
        { status: 500 }
      );
    }

    const { userId, paymentType, days } = JSON.parse(customIdStr);

    if (!userId || !days) {
      console.error("[PayPal Capture] Invalid custom_id data:", customIdStr);
      return NextResponse.json(
        { error: "Invalid user information in order" },
        { status: 500 }
      );
    }

    console.log("[PayPal Capture] Processing for user:", userId, "days:", days);

    // 4. Update Supabase user status
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Update or create subscription
    // Note: user_id might be a CloudBase string ID, not a UUID
    const subscriptionData = {
      user_id: userId,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
      plan_type: paymentType || "pro",
    };
    console.log("[PayPal Capture] Inserting subscription data:", JSON.stringify(subscriptionData));

    const { data: subscriptionResult, error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData)
      .select();

    if (subscriptionError) {
      console.error("[PayPal Capture] Subscription update failed:", JSON.stringify(subscriptionError));
      console.error("[PayPal Capture] Subscription error details - code:", subscriptionError.code, "message:", subscriptionError.message, "details:", subscriptionError.details);
      return NextResponse.json(
        { error: "Failed to update subscription: " + subscriptionError.message },
        { status: 500 }
      );
    }

    console.log("[PayPal Capture] Subscription created/updated:", JSON.stringify(subscriptionResult));

    // 5. Update payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .update({ status: "completed" })
      .eq("payment_id", token);

    if (paymentError) {
      console.error("[PayPal Capture] Payment update failed:", paymentError);
      // Don't fail the whole request if payment update fails
    }

    console.log("[PayPal Capture] Successfully completed for user:", userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PayPal Capture] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
