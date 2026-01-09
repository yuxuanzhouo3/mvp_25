"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { getAccessToken } from "@/components/auth/auth-provider";

interface WechatNativePaymentProps {
  orderId: string;
  codeUrl: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type PaymentStatus = "pending" | "polling" | "paid" | "failed" | "expired";

export function WechatNativePayment({
  orderId,
  codeUrl,
  amount,
  billingCycle,
  onSuccess,
  onError,
}: WechatNativePaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [countdown, setCountdown] = useState(300); // 5 分钟倒计时
  const [error, setError] = useState<string | null>(null);

  // 格式化金额（amount 已经是元为单位）
  const formatAmount = (yuan: number) => {
    return yuan.toFixed(2);
  };

  // 轮询支付状态
  const checkPaymentStatus = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setError("登录已过期，请重新登录");
        setStatus("failed");
        return;
      }

      const response = await fetch(`/api/payment/status?orderId=${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.order) {
        if (data.order.status === "paid") {
          setStatus("paid");
          onSuccess?.();
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error("Check payment status error:", err);
      return false;
    }
  }, [orderId, onSuccess]);

  // 开始轮询
  useEffect(() => {
    if (status !== "pending" && status !== "polling") {
      return;
    }

    setStatus("polling");

    const pollInterval = setInterval(async () => {
      const isPaid = await checkPaymentStatus();
      if (isPaid) {
        clearInterval(pollInterval);
      }
    }, 3000); // 每 3 秒轮询一次

    return () => clearInterval(pollInterval);
  }, [status, checkPaymentStatus]);

  // 倒计时
  useEffect(() => {
    if (status === "paid" || status === "failed") {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          onError?.("支付已过期");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, onError]);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 刷新二维码
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.003-.271-.028-.406-.031zm-2.405 3.023c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
          </svg>
          微信支付
        </CardTitle>
        <CardDescription>
          {billingCycle === "monthly" ? "月度会员" : "年度会员"} - ¥{formatAmount(amount)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center space-y-4">
        {status === "paid" ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-lg font-medium text-green-600">支付成功</p>
            <p className="text-sm text-muted-foreground">
              您的会员已激活
            </p>
          </div>
        ) : status === "expired" ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <XCircle className="w-16 h-16 text-red-500" />
            <p className="text-lg font-medium text-red-600">二维码已过期</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新重试
            </Button>
          </div>
        ) : status === "failed" ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <XCircle className="w-16 h-16 text-red-500" />
            <p className="text-lg font-medium text-red-600">支付失败</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重新支付
            </Button>
          </div>
        ) : (
          <>
            {/* 二维码 */}
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeSVG
                value={codeUrl}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* 提示文字 */}
            <p className="text-sm text-muted-foreground text-center">
              请使用微信扫描二维码完成支付
            </p>

            {/* 轮询状态 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>等待支付...</span>
            </div>

            {/* 倒计时 */}
            <p className="text-sm text-muted-foreground">
              二维码有效期：{formatCountdown(countdown)}
            </p>

            {/* 订单号 */}
            <p className="text-xs text-muted-foreground">
              订单号：{orderId}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
