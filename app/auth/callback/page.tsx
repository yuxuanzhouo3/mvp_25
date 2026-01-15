"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/integrations/supabase";
import { saveSupabaseUserCache } from "@/lib/auth/auth-state-manager-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

function AuthCallbackContent() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 [OAuth Callback] 开始处理认证回调...");

        const supabase = getSupabaseClient();

        // Supabase 会自动从 URL hash 中提取 session
        // 我们只需要调用 getSession() 即可
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ [OAuth Callback] 获取 session 失败:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (session) {
          console.log("✅ [OAuth Callback] 认证成功:", session.user.email);

          // 保存用户信息到缓存
          const userProfile = {
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

          saveSupabaseUserCache(userProfile);

          // 等待一下让 UserContext 更新
          setTimeout(() => {
            router.replace("/");
          }, 500);
        } else {
          console.log("❌ [OAuth Callback] 没有找到有效的 session");
          setError(t.callback.failed);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ [OAuth Callback] 处理异常:", err);
        setError(err instanceof Error ? err.message : t.callback.failed);
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-center text-gray-600 dark:text-gray-300">
                {t.callback.processing}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{error ? t.callback.failed : t.callback.success}</CardTitle>
          <CardDescription className="text-center">
            {error ? t.callback.tryAgain : t.callback.redirecting}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>{t.callback.redirecting}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {t.callback.backToLogin}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-center text-gray-600 dark:text-gray-300">
                  Loading...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
