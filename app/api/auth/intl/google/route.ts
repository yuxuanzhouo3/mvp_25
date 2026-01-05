/**
 * 国际版 Google OAuth 登录 API（Supabase）
 */

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/integrations/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (data.url) {
      return NextResponse.redirect(data.url);
    }

    return NextResponse.json({ success: false, error: "未获取到授权URL" }, { status: 500 });
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Google 登录失败" },
      { status: 500 }
    );
  }
}
