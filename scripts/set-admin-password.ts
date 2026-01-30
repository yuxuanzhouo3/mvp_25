import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../lib/integrations/supabase-admin";

async function setAdminPassword() {
  const supabase = getSupabaseAdmin();
  const username = "admin";
  const newPassword = "admin123";

  console.log("正在修改管理员密码...");
  console.log("用户名:", username);
  console.log("新密码:", newPassword);

  // 哈希新密码
  const passwordHash = await bcrypt.hash(newPassword, 10);
  console.log("密码哈希完成");

  // 更新数据库
  const { data, error } = await supabase
    .from("admin_users")
    .update({ password_hash: passwordHash })
    .eq("username", username)
    .select();

  if (error) {
    console.error("更新失败:", error);
    process.exit(1);
  }

  console.log("\n✓ 密码修改成功!");
  console.log("\n登录信息:");
  console.log("  用户名: admin");
  console.log("  密码: admin123");
  console.log("\n登录地址:");
  console.log("  https://aiteacherfff-219330-8-1381714604.sh.run.tcloudbase.com/admin/login");
}

setAdminPassword().catch(console.error);
