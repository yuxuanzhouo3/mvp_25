"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 延迟显示内容以配合动画
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    // 播放庆祝动画（动态导入避免 SSR 问题）
    const celebration = setTimeout(async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // 忽略 confetti 错误
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(celebration);
    };
  }, []);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleStartUsing = () => {
    router.push("/assessment");
  };

  return (
    <Card className={`w-full max-w-md transition-all duration-500 ${
      showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    }`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">支付成功！</CardTitle>
        <CardDescription>
          感谢您的支持，您的会员已激活
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 会员信息 */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">会员状态</span>
            <span className="text-sm font-medium text-green-600">已激活</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">会员类型</span>
            <span className="text-sm font-medium">AI教师助手会员</span>
          </div>
        </div>

        {/* 权益提示 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>您现在可以享受以下权益：</p>
          <ul className="mt-2 space-y-1">
            <li>✓ 无限次 AI 出题</li>
            <li>✓ 智能组卷功能</li>
            <li>✓ 题目难度分析</li>
            <li>✓ 个性化教学建议</li>
          </ul>
        </div>

        {/* 按钮 */}
        <div className="space-y-3">
          <Button className="w-full" onClick={handleStartUsing}>
            开始使用
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoHome}>
            返回首页
          </Button>
        </div>

        {/* 客服提示 */}
        <p className="text-xs text-center text-muted-foreground">
          如有任何问题，请联系客服支持
        </p>
      </CardContent>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
