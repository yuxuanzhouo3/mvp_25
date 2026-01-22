"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { UserProviderIntl } from "@/components/user-context-intl";
import { Toaster } from "@/components/ui/sonner";
import { isChinaRegion } from "@/lib/config/region";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 客户端 Providers 包装组件
 * 根据部署区域选择正确的认证 Provider
 * 解决服务端预渲染时 Context Provider 不可用的问题
 *
 * 注意：管理后台 (/admin) 使用独立的认证系统，不需要用户端认证 Provider
 */
export function Providers({ children }: ProvidersProps) {
  const [isAdminPath, setIsAdminPath] = useState(false);
  const isChina = isChinaRegion();

  useEffect(() => {
    // 检测当前路径是否为管理后台
    if (typeof window !== "undefined") {
      setIsAdminPath(window.location.pathname.startsWith("/admin"));
    }
  }, []);

  // 管理后台不使用用户端认证 Provider
  if (isAdminPath) {
    return <>{children}<Toaster /></>;
  }

  if (isChina) {
    return (
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    );
  }

  return (
    <UserProviderIntl>
      {children}
      <Toaster />
    </UserProviderIntl>
  );
}
