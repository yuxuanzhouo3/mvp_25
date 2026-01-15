"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/integrations/supabase";
import {
  saveSupabaseUserCache,
  getSupabaseUserCache,
  clearSupabaseUserCache,
} from "@/lib/auth/auth-state-manager-intl";

// 获取 Supabase 客户端实例
const supabase = getSupabaseClient();

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  subscription_plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  membership_expires_at?: string;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  isLoading: boolean; // 兼容字段，与 loading 相同
  isAuthenticated: boolean; // 兼容字段，user !== null
  isAuthInitialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProviderIntl({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // 登录 - 触发 Google OAuth 流程
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ [Auth INTL] Google 登录失败:", error);
        throw error;
      }
      // OAuth 会自动重定向，不需要手动处理
    } catch (error) {
      console.error("❌ [Auth INTL] signInWithGoogle 异常:", error);
      throw error;
    }
  }, []);

  // 登出
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ [Auth INTL] 登出失败:", error);
      }
      clearSupabaseUserCache();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      console.log("🔄 [Auth INTL] 刷新用户信息...");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ [Auth INTL] 刷新失败:", error);
        return;
      }

      if (session?.user) {
        const updatedUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || "",
          name:
            session.user.user_metadata?.displayName ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            "",
          avatar:
            session.user.user_metadata?.avatar ||
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            "",
        };

        setUser(updatedUser);
        saveSupabaseUserCache(updatedUser);
        console.log("✅ [Auth INTL] 用户信息已刷新");
      }
    } catch (error) {
      console.error("❌ [Auth INTL] 刷新用户信息失败:", error);
    }
  }, []);

  // 初始化认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("📝 [Auth INTL] 初始化认证状态...");

        // 1. 优先从缓存读取
        const cachedUser = getSupabaseUserCache();
        if (cachedUser) {
          console.log(`📦 [Auth INTL] 从缓存恢复用户: ${cachedUser.email}`);
          setUser(cachedUser);
          setIsAuthInitialized(true);
          setLoading(false);
          return;
        }

        // 2. 缓存未命中，从 Supabase 读取
        console.log("🔍 [Auth INTL] 缓存未命中，从 Supabase 读取 session...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ [Auth INTL] Supabase getSession 失败:", error);
          setUser(null);
        } else if (session?.user) {
          console.log(
            `✅ [Auth INTL] 从 Supabase 恢复用户: ${session.user.email}`
          );
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || "",
            name:
              session.user.user_metadata?.displayName ||
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              "",
            avatar:
              session.user.user_metadata?.avatar ||
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              "",
          };
          setUser(userProfile);
          saveSupabaseUserCache(userProfile);
        } else {
          console.log("❌ [Auth INTL] 无有效认证状态");
          setUser(null);
        }

        setIsAuthInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error("❌ [Auth INTL] 初始化失败:", error);
        setUser(null);
        setIsAuthInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 多标签页同步 (storage 事件)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "supabase-user-cache") {
        console.log("📡 [Auth INTL] 检测到其他标签页的用户信息变化");
        if (!event.newValue) {
          setUser(null);
        } else {
          try {
            const cache = JSON.parse(event.newValue);
            if (cache.user) {
              setUser(cache.user as UserProfile);
              console.log("✅ [Auth INTL] 从其他标签页同步用户信息");
            }
          } catch (error) {
            console.error("❌ [Auth INTL] 解析跨标签页数据失败:", error);
            setUser(null);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 同标签页内自定义事件监听
  useEffect(() => {
    const handleSupabaseUserChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("🔔 [Auth INTL] 检测到同标签页内用户信息变化");
      if (customEvent.detail) {
        setUser(customEvent.detail as UserProfile);
      } else {
        setUser(null);
      }
    };

    window.addEventListener("supabase-user-changed", handleSupabaseUserChanged);

    return () => {
      window.removeEventListener(
        "supabase-user-changed",
        handleSupabaseUserChanged
      );
    };
  }, []);

  // Supabase 认证状态变化监听
  useEffect(() => {
    console.log("🌍 [Auth INTL] 设置 Supabase auth 状态变化监听器...");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 [Auth INTL] Supabase 认证事件: ${event}`);

      if (session?.user) {
        console.log(`✅ [Auth INTL] Supabase 用户登录: ${session.user.email}`);
        const userProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || "",
          name:
            session.user.user_metadata?.displayName ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            "",
          avatar:
            session.user.user_metadata?.avatar ||
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            "",
        };
        setUser(userProfile);
        saveSupabaseUserCache(userProfile);
      } else {
        console.log("❌ [Auth INTL] Supabase 用户登出");
        setUser(null);
        clearSupabaseUserCache();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      isLoading: loading, // 兼容字段
      isAuthenticated: user !== null, // 兼容字段
      isAuthInitialized,
      signInWithGoogle,
      signOut,
      refreshUser,
    }),
    [user, loading, isAuthInitialized, signInWithGoogle, signOut, refreshUser]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUserIntl() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserIntl must be used within a UserProviderIntl");
  }
  return context;
}
