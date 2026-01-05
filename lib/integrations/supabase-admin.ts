/**
 * Supabase 服务端客户端（国际版）
 * 用于服务端 API 路由，拥有管理员权限
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    throw new Error("Supabase credentials are missing. Please check your environment variables.");
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey || anonKey, {
    auth: {
      persistSession: false, // 服务端不需要持久化 session
      autoRefreshToken: false, // 服务端不需要自动刷新
    },
  });

  return supabaseAdminInstance;
}
