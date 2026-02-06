"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

function WechatCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const t = useT();

  useEffect(() => {
    const processWechatLogin = async () => {
      console.log("[CALLBACK PAGE] ========== 开始处理微信登录回调 ==========");
      const code = searchParams.get("code");
      const redirect = searchParams.get("redirect") || "/";
      const source = searchParams.get("source"); // 'app' 或 null

      console.log("[CALLBACK PAGE] URL参数:");
      console.log("[CALLBACK PAGE] - code:", code);
      console.log("[CALLBACK PAGE] - redirect:", redirect);
      console.log("[CALLBACK PAGE] - source:", source);

      if (!code) {
        console.error("[CALLBACK PAGE] 缺少授权码!");
        setError("缺少授权码");
        setIsProcessing(false);
        return;
      }

      try {
        // 根据来源调用不同的微信登录 API
        // source=app 时调用 APP 端登录接口，否则调用网页端登录接口
        const apiEndpoint = source === "app" ? "/api/auth/wechat/app" : "/api/auth/wechat";
        console.log("[CALLBACK PAGE] 选择的API端点:", apiEndpoint);
        console.log("[CALLBACK PAGE] 准备发送请求...");

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        console.log("[CALLBACK PAGE] 收到响应:");
        console.log("[CALLBACK PAGE] - status:", response.status);
        console.log("[CALLBACK PAGE] - ok:", response.ok);

        const data = await response.json();

        console.log("[CALLBACK PAGE] API响应数据:", data);

        if (!response.ok || !data.success) {
          setError(data.error || "微信登录失败");
          setIsProcessing(false);
          return;
        }

        // 构建带认证参数的重定向 URL（处理已有查询参数的情况）
        try {
          const redirectUrl = new URL(redirect, window.location.origin);
          redirectUrl.searchParams.set('token', data.accessToken);
          redirectUrl.searchParams.set('openid', data.user.id);
          redirectUrl.searchParams.set('expiresIn', String(data.tokenMeta?.accessTokenExpiresIn || 3600));
          if (data.user.name) redirectUrl.searchParams.set('mpNickName', data.user.name);
          if (data.user.avatar) redirectUrl.searchParams.set('mpAvatarUrl', data.user.avatar);

          window.location.href = redirectUrl.toString();
        } catch (err) {
          // Fallback: 如果 redirect 不是有效 URL，使用简单拼接
          const params = new URLSearchParams({
            token: data.accessToken,
            openid: data.user.id,
            expiresIn: String(data.tokenMeta?.accessTokenExpiresIn || 3600),
          });
          if (data.user.name) params.set('mpNickName', data.user.name);
          if (data.user.avatar) params.set('mpAvatarUrl', data.user.avatar);

          const separator = redirect.includes('?') ? '&' : '?';
          window.location.href = `${redirect}${separator}${params.toString()}`;
        }
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
        <CardTitle className="text-center">{t.wechatAuth.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t.wechatAuth.processing}</p>
      </CardContent>
    </Card>
  );
}

export default function WechatCallbackPage() {
  const t = useT();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t.wechatAuth.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t.wechatAuth.loading}</p>
          </CardContent>
        </Card>
      }>
        <WechatCallbackContent />
      </Suspense>
    </div>
  );
}
