/**
 * 获取当前用户信息（Supabase）
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/integrations/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name || user.email?.split("@")[0],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "获取用户信息失败" },
      { status: 500 }
    );
  }
}
