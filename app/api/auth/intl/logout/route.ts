/**
 * 登出 API（Supabase）
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/integrations/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "登出成功" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "登出失败" },
      { status: 500 }
    );
  }
}
