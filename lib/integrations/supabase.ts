/**
 * Supabase 客户端初始化（国际版认证和数据库）
 * 用于客户端（浏览器）
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials are missing. Please check your environment variables.");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true, // 自动刷新 token
      persistSession: true, // 持久化 session 到 localStorage
      detectSessionInUrl: true, // OAuth 回调时自动提取 token
    },
  });

  return supabaseInstance;
}
