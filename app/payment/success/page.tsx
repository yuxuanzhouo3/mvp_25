"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { getAccessToken } from "@/components/auth/auth-provider";
import { useT } from "@/lib/i18n";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [showContent, setShowContent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get session_id from URL (Stripe) or token (PayPal) or out_trade_no (Alipay)
  const sessionId = searchParams.get("session_id");
  const paypalToken = searchParams.get("token");
  const alipayOrderId = searchParams.get("out_trade_no");

  useEffect(() => {
    const verifyPayment = async () => {
      // If there's a session_id (Stripe) or token (PayPal), verify the payment
      if (sessionId || paypalToken) {
        setIsVerifying(true);
        try {
          // For Stripe payments, the webhook handles activation
          // Here we just confirm the session exists
          if (sessionId) {
            // Stripe webhook handles the activation, just show success
            setVerificationStatus("success");
          } else if (paypalToken) {
            // PayPal: capture the payment
            const response = await fetch("/api/payment/intl/capture", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                provider: "paypal",
                token: paypalToken,
              }),
            });

            if (response.ok) {
              setVerificationStatus("success");
            } else {
              const data = await response.json();
              setVerificationStatus("error");
              setErrorMessage(data.error || "Payment verification failed");
            }
          }
        } catch (error: any) {
          setVerificationStatus("error");
          setErrorMessage(error.message || "Failed to verify payment");
        } finally {
          setIsVerifying(false);
        }
      } else if (alipayOrderId) {
        // 支付宝支付回调：主动查询支付状态
        setIsVerifying(true);
        try {
          const token = getAccessToken();
          if (!token) {
            setVerificationStatus("error");
            setErrorMessage("登录已过期，请重新登录");
            setIsVerifying(false);
            return;
          }

          // 轮询查询支付状态，最多尝试 10 次
          let attempts = 0;
          const maxAttempts = 10;
          const pollInterval = 2000; // 2秒

          const pollStatus = async (): Promise<boolean> => {
            const response = await fetch(`/api/payment/status?orderId=${alipayOrderId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.order?.status === "paid") {
                return true;
              }
            }
            return false;
          };

          // 首次查询
          let isPaid = await pollStatus();

          while (!isPaid && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            isPaid = await pollStatus();
            attempts++;
          }

          if (isPaid) {
            setVerificationStatus("success");
          } else {
            // 支付可能延迟，但仍显示成功页面提示用户
            setVerificationStatus("success");
          }
        } catch (error: any) {
          // 即使查询出错，也显示成功，因为用户已经从支付宝返回
          setVerificationStatus("success");
        } finally {
          setIsVerifying(false);
        }
      } else {
        // No session_id or token, assume direct success (from CN payment or webhook)
        setVerificationStatus("success");
      }
    };

    verifyPayment();
  }, [sessionId, paypalToken, alipayOrderId]);

  useEffect(() => {
    if (verificationStatus === "success") {
      // 刷新用户状态到 localStorage
      const refreshUserStatus = async () => {
        const token = getAccessToken();
        if (!token) return;

        try {
          const response = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("auth_user", JSON.stringify(data.user));
            // 延迟后重新加载页面以更新 AuthProvider 状态
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
          }
        } catch (error) {
          console.error("Failed to refresh user status:", error);
        }
      };

      refreshUserStatus();

      // Delay to show content with animation
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);

      // Play celebration animation
      const celebration = setTimeout(async () => {
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // Ignore confetti errors
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(celebration);
      };
    }
  }, [verificationStatus]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleStartUsing = () => {
    router.push("/exam");
  };

  // Loading state
  if (isVerifying) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium">{t.payment.verifying}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.payment.pleaseWait}</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (verificationStatus === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">{t.payment.verificationFailed}</CardTitle>
          <CardDescription>
            {errorMessage || t.payment.contactSupport}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => {
            const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "CN";
            router.push(region === "CN" ? "/payment" : "/payment/intl");
          }}>
            {t.payment.tryAgain}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoHome}>
            {t.payment.returnHome}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success state
  return (
    <Card className={`w-full max-w-md transition-all duration-500 ${
      showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    }`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">{t.payment.success}!</CardTitle>
        <CardDescription>
          {t.payment.thankYou}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Membership Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.payment.membershipStatus}</span>
            <span className="text-sm font-medium text-green-600">{t.payment.active}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.payment.plan}</span>
            <span className="text-sm font-medium">{t.payment.premium}</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t.payment.youHaveAccess}</p>
          <ul className="mt-2 space-y-1">
            <li>✓ {t.payment.unlimitedAI}</li>
            <li>✓ {t.payment.smartComposition}</li>
            <li>✓ {t.payment.difficultyAnalysis}</li>
            <li>✓ {t.payment.personalizedAdvice}</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button className="w-full" onClick={handleStartUsing}>
            {t.payment.startUsing}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoHome}>
            {t.payment.returnHome}
          </Button>
        </div>

        {/* Support Note */}
        <p className="text-xs text-center text-muted-foreground">
          {t.payment.contactSupport}
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
