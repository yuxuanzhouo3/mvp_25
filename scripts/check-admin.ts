import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../lib/integrations/supabase-admin";

async function checkAdmin() {
  const supabase = getSupabaseAdmin();

  console.log("正在查询 Supabase 中的 admin 用户...");

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("username", "admin")
    .single();

  if (error) {
    console.error("查询失败:", error);
    return;
  }

  if (!admin) {
    console.log("❌ 没有找到 admin 用户！");
    return;
  }

  console.log("\n✅ 找到 admin 用户:");
  console.log("  ID:", admin.id);
  console.log("  用户名:", admin.username);
  console.log("  角色:", admin.role);
  console.log("  状态:", admin.status);
  console.log("  密码哈希:", admin.password_hash ? "已设置" : "未设置");

  // 测试密码验证
  console.log("\n正在测试密码验证...");
  const testPassword = "admin123";
  const isValid = await bcrypt.compare(testPassword, admin.password_hash);

  console.log(`  密码 "${testPassword}" 验证结果:`, isValid ? "✅ 正确" : "❌ 错误");

  // 如果验证失败，尝试其他可能的管理员密码
  if (!isValid) {
    console.log("\n尝试其他可能的密码...");
    const possiblePasswords = ["admin", "Zyx!213416", "12345678"];

    for (const pwd of possiblePasswords) {
      const testResult = await bcrypt.compare(pwd, admin.password_hash);
      if (testResult) {
        console.log(`  ✅ 密码 "${pwd}" 正确！`);
        break;
      }
    }
  }
}

checkAdmin().catch(console.error);
