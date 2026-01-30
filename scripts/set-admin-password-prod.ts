import { config } from "dotenv";
// 加载生产环境变量（如果存在 .env.production）
config({ path: ".env.production" });
// 回退到 .env
config({ path: ".env" });

import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../lib/integrations/supabase-admin";

async function setAdminPassword() {
  const supabase = getSupabaseAdmin();
  const username = "admin";
  const newPassword = "admin123";

  console.log("正在修改生产环境管理员密码...");
  console.log("用户名:", username);
  console.log("新密码:", newPassword);

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { data, error } = await supabase
    .from("admin_users")
    .update({ password_hash: passwordHash })
    .eq("username", username)
    .select();

  if (error) {
    console.error("更新失败:", error);
    process.exit(1);
  }

  console.log("\n✓ 生产环境密码修改成功!");
}

setAdminPassword().catch(console.error);
