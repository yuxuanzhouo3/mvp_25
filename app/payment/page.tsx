"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WechatNativePayment } from "@/components/payment/wechat-native-payment";
import { AlipayPayment } from "@/components/payment/alipay-payment";
import { Loader2, Check, CreditCard, Sparkles } from "lucide-react";

type BillingCycle = "monthly" | "yearly";
type PaymentMethod = "wechat" | "alipay";

interface PaymentState {
  isCreating: boolean;
  orderId: string | null;
  paymentMethod: PaymentMethod | null;
  codeUrl: string | null; // 微信支付二维码
  formHtml: string | null; // 支付宝表单
  amount: number;
  billingCycle: BillingCycle;
}

const PRICING = {
  monthly: {
    price: 29.9,
    originalPrice: 39.9,
    label: "月度会员",
    description: "按月付费，灵活便捷",
  },
  yearly: {
    price: 299,
    originalPrice: 478.8,
    label: "年度会员",
    description: "年付更优惠，省 ¥179.8",
    badge: "推荐",
  },
};

const FEATURES = [
  "无限次 AI 出题",
  "智能组卷功能",
  "题目难度分析",
  "个性化教学建议",
  "历史记录保存",
  "优先客服支持",
];

export default function PaymentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wechat");
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isCreating: false,
    orderId: null,
    paymentMethod: null,
    codeUrl: null,
    formHtml: null,
    amount: 0,
    billingCycle: "yearly",
  });
  const [error, setError] = useState<string | null>(null);

  // 检查登录状态
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login?redirect=/payment");
    return null;
  }

  // 创建支付订单
  const handleCreatePayment = async () => {
    setError(null);
    setPaymentState((prev) => ({ ...prev, isCreating: true }));

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login?redirect=/payment");
        return;
      }

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billingCycle,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "创建订单失败");
      }

      setPaymentState({
        isCreating: false,
        orderId: data.orderId,
        paymentMethod: data.paymentMethod,
        codeUrl: data.codeUrl || null,
        formHtml: data.formHtml || null,
        amount: data.amount,
        billingCycle: data.billingCycle,
      });
    } catch (err: any) {
      setError(err.message || "创建订单失败，请重试");
      setPaymentState((prev) => ({ ...prev, isCreating: false }));
    }
  };

  // 支付成功回调
  const handlePaymentSuccess = () => {
    router.push("/payment/success");
  };

  // 如果已创建订单，显示支付组件
  if (paymentState.orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => setPaymentState({
              isCreating: false,
              orderId: null,
              paymentMethod: null,
              codeUrl: null,
              formHtml: null,
              amount: 0,
              billingCycle: "yearly",
            })}
            className="mb-4"
          >
            ← 返回选择
          </Button>

          {paymentState.paymentMethod === "wechat" && paymentState.codeUrl ? (
            <WechatNativePayment
              orderId={paymentState.orderId}
              codeUrl={paymentState.codeUrl}
              amount={paymentState.amount}
              billingCycle={paymentState.billingCycle}
              onSuccess={handlePaymentSuccess}
            />
          ) : paymentState.paymentMethod === "alipay" && paymentState.formHtml ? (
            <AlipayPayment
              orderId={paymentState.orderId}
              formHtml={paymentState.formHtml}
              amount={paymentState.amount}
              billingCycle={paymentState.billingCycle}
              onSuccess={handlePaymentSuccess}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">支付方式错误</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">升级为会员</h1>
          <p className="text-muted-foreground">
            解锁全部功能，让 AI 成为您的得力助手
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 左侧：套餐选择 */}
          <div className="space-y-6">
            {/* 套餐选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  选择套餐
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 年度套餐 */}
                <div
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingCycle === "yearly"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  {PRICING.yearly.badge && (
                    <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-yellow-400 to-orange-500">
                      {PRICING.yearly.badge}
                    </Badge>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{PRICING.yearly.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {PRICING.yearly.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">¥{PRICING.yearly.price}</p>
                      <p className="text-sm text-muted-foreground line-through">
                        ¥{PRICING.yearly.originalPrice}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 月度套餐 */}
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingCycle === "monthly"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{PRICING.monthly.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {PRICING.monthly.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">¥{PRICING.monthly.price}</p>
                      <p className="text-sm text-muted-foreground line-through">
                        ¥{PRICING.monthly.originalPrice}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 支付方式选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  支付方式
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wechat" className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z" />
                      </svg>
                      微信支付
                    </TabsTrigger>
                    <TabsTrigger value="alipay" className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.227 13.02a12.94 12.94 0 0 0 1.618.912c-.104.248-.216.492-.341.732-.298.573-.652 1.108-1.073 1.588-.422.48-.907.9-1.454 1.256-.547.356-1.151.64-1.808.848-1.064.337-2.198.44-3.402.307l.69-1.164c.927.1 1.79-.05 2.578-.447z" />
                      </svg>
                      支付宝
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* 错误提示 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 支付按钮 */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleCreatePayment}
              disabled={paymentState.isCreating}
            >
              {paymentState.isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建订单中...
                </>
              ) : (
                <>
                  立即支付 ¥{PRICING[billingCycle].price}
                </>
              )}
            </Button>
          </div>

          {/* 右侧：功能列表 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>会员权益</CardTitle>
              <CardDescription>
                成为会员后，您将获得以下权益
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>满意保证：</strong>如果您对服务不满意，可在购买后 7 天内联系客服申请退款。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
