"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function WechatCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processWechatLogin = async () => {
      const code = searchParams.get("code");
      const redirect = searchParams.get("redirect") || "/";

      if (!code) {
        setError("缺少授权码");
        setIsProcessing(false);
        return;
      }

      try {
        // 调用微信登录 API
        const response = await fetch("/api/auth/wechat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || "微信登录失败");
          setIsProcessing(false);
          return;
        }

        // 保存 tokens
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "auth_tokens",
            JSON.stringify({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresAt: Date.now() + (data.tokenMeta?.accessTokenExpiresIn || 3600) * 1000,
            })
          );
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        }

        // 跳转到目标页面
        router.push(redirect);
        router.refresh();
      } catch (err: any) {
        console.error("WeChat login error:", err);
        setError(err.message || "微信登录失败，请重试");
        setIsProcessing(false);
      }
    };

    processWechatLogin();
  }, [searchParams, router]);

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">登录失败</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-primary underline"
          >
            返回登录页面
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">微信登录中</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">正在处理微信授权...</p>
      </CardContent>
    </Card>
  );
}

export default function WechatCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">微信登录中</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">正在加载...</p>
          </CardContent>
        </Card>
      }>
        <WechatCallbackContent />
      </Suspense>
    </div>
  );
}
