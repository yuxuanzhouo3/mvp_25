"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  pro?: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  membership_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, confirmPassword: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_tokens";
const USER_KEY = "auth_user";

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 获取 tokens
  const getStoredTokens = useCallback((): StoredTokens | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // 保存 tokens 到 localStorage
  const saveTokens = useCallback((accessToken: string, refreshToken: string, expiresIn: number) => {
    if (typeof window === "undefined") return;
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken, expiresAt }));
  }, []);

  // 保存用户信息
  const saveUser = useCallback((userData: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // 清除认证信息
  const clearAuth = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // 刷新 access token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const data = await response.json();
      saveTokens(data.accessToken, tokens.refreshToken, data.tokenMeta?.accessTokenExpiresIn || 3600);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [getStoredTokens, saveTokens, clearAuth]);

  // 获取当前用户信息
  const fetchCurrentUser = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens?.accessToken) {
      setIsLoading(false);
      return;
    }

    // 检查 token 是否快过期，如果是则刷新
    if (tokens.expiresAt && Date.now() > tokens.expiresAt - 60000) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const currentTokens = getStoredTokens();
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${currentTokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        saveUser(data.user);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [getStoredTokens, refreshAccessToken, saveUser, clearAuth]);

  // 初始化时检查认证状态
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 登录
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "登录失败" };
      }

      saveTokens(data.accessToken, data.refreshToken, data.tokenMeta?.accessTokenExpiresIn || 3600);
      saveUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "网络错误" };
    }
  };

  // 注册
  const register = async (
    email: string,
    password: string,
    confirmPassword: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "注册失败" };
      }

      saveTokens(data.accessToken, data.refreshToken, data.tokenMeta?.accessTokenExpiresIn || 3600);
      saveUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "网络错误" };
    }
  };

  // 登出
  const logout = async () => {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      } catch {
        // 忽略登出请求错误
      }
    }
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 获取存储的 access token（用于 API 调用）
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    const tokens = JSON.parse(stored) as StoredTokens;
    return tokens.accessToken;
  } catch {
    return null;
  }
}
