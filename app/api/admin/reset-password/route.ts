/**
 * 管理员密码重置 API
 *
 * 用法：访问 /api/admin/reset-password
 * 自动将 CloudBase 和 Supabase 的 admin 密码重置为 admin123
 *
 * 安全警告：此端点仅供开发/测试使用，生产环境应删除！
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCloudBaseDatabase } from "@/lib/cloudbase/init";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function GET() {
  try {
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const results = {
      supabase: { success: false, error: null },
      cloudbase: { success: false, error: null }
    };

    // 重置 Supabase 管理员密码
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("admin_users")
        .update({ password_hash: hashedPassword })
        .eq("username", "admin")
        .select();

      if (error) {
        results.supabase.error = error.message;
      } else {
        results.supabase.success = true;
      }
    } catch (err: any) {
      results.supabase.error = err.message;
    }

    // 重置 CloudBase 管理员密码
    try {
      const database = getCloudBaseDatabase();
      const result = await database
        .collection("admin_users")
        .where({ username: "admin" })
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        });

      results.cloudbase.success = true;
    } catch (err: any) {
      results.cloudbase.error = err.message;
    }

    return NextResponse.json({
      success: true,
      message: "密码已重置为: admin123",
      results,
      warning: "请立即删除此端点或限制访问权限！"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
