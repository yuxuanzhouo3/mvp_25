/**
 * 国际版邮箱注册 API（Supabase）
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 使用 Supabase 内置注册
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0],
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // 创建用户资料记录
    if (data.user) {
      await supabase.from("user_profiles").insert({
        id: data.user.id,
        email: data.user.email,
        display_name: displayName || email.split("@")[0],
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        displayName: displayName || email.split("@")[0],
      },
      message: "注册成功，请检查邮箱激活账户",
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "注册失败" },
      { status: 500 }
    );
  }
}
