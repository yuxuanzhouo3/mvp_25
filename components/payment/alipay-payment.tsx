"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

interface AlipayPaymentProps {
  orderId: string;
  formHtml: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  onSuccess?: () => void;
}

export function AlipayPayment({
  orderId,
  formHtml,
  amount,
  billingCycle,
  onSuccess,
}: AlipayPaymentProps) {
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 格式化金额（amount 已经是元为单位）
  const formatAmount = (yuan: number) => {
    return yuan.toFixed(2);
  };

  // 提交表单
  const handleSubmit = () => {
    if (formContainerRef.current && !hasSubmitted) {
      setIsSubmitting(true);
      setHasSubmitted(true);

      // 插入表单 HTML
      formContainerRef.current.innerHTML = formHtml;

      // 自动提交表单
      const form = formContainerRef.current.querySelector("form");
      if (form) {
        form.submit();
      }
    }
  };

  // 自动提交（可选）
  useEffect(() => {
    // 如果需要自动跳转，取消注释下面的代码
    // const timer = setTimeout(() => {
    //   handleSubmit();
    // }, 1000);
    // return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.227 13.02c.003.003.003.004.003.004a12.94 12.94 0 0 0 1.615.908c-.104.248-.216.492-.341.732-.298.573-.652 1.108-1.073 1.588-.422.48-.907.9-1.454 1.256-.547.356-1.151.64-1.808.848-1.064.337-2.198.44-3.402.307l.69-1.164c.927.1 1.79-.05 2.578-.447.788-.396 1.464-.962 2.033-1.7.568-.738 1.013-1.578 1.337-2.522.323-.944.52-1.923.59-2.932H3.73V8.394h4.09V6.49H3.73V5.006h4.09V2.084h1.694v2.922h4.104v1.484H9.514v1.904h4.104v1.504H9.514c-.067.927-.234 1.833-.502 2.716 1.008.389 1.988.864 2.934 1.423l-.698 1.196a16.66 16.66 0 0 0-2.58-1.27c-.073.156-.15.31-.233.461a10.64 10.64 0 0 1-.947 1.423c-.36.44-.772.838-1.236 1.188-.464.35-.98.64-1.547.87-.568.23-1.185.39-1.85.483L2 15.354c.627-.093 1.198-.273 1.715-.539.517-.266.976-.608 1.377-1.027.4-.418.743-.908 1.03-1.468.285-.56.51-1.175.673-1.845h-.003zm11.56-8.08c.934 0 1.8.243 2.597.728.797.485 1.43 1.145 1.9 1.98.47.834.705 1.754.705 2.758 0 1.004-.235 1.923-.705 2.758-.47.834-1.103 1.495-1.9 1.98-.797.485-1.663.728-2.597.728s-1.8-.243-2.597-.728c-.797-.485-1.43-1.145-1.9-1.98-.47-.835-.705-1.754-.705-2.758 0-1.004.235-1.924.705-2.758.47-.835 1.103-1.495 1.9-1.98.797-.485 1.663-.728 2.597-.728zm0 1.504c-.654 0-1.26.17-1.82.51-.56.34-1.003.8-1.33 1.38-.326.58-.49 1.222-.49 1.926 0 .704.164 1.346.49 1.926.327.58.77 1.04 1.33 1.38.56.34 1.166.51 1.82.51.654 0 1.26-.17 1.82-.51.56-.34 1.003-.8 1.33-1.38.326-.58.49-1.222.49-1.926 0-.704-.164-1.346-.49-1.926-.327-.58-.77-1.04-1.33-1.38-.56-.34-1.166-.51-1.82-.51zM17.787 17c.934 0 1.8.243 2.597.728.797.485 1.43 1.145 1.9 1.98.47.834.705 1.754.705 2.758h-1.694c0-.704-.164-1.346-.49-1.926-.327-.58-.77-1.04-1.33-1.38-.56-.34-1.166-.51-1.82-.51-.654 0-1.26.17-1.82.51-.56.34-1.003.8-1.33 1.38-.326.58-.49 1.222-.49 1.926H12.32c0-1.004.235-1.924.705-2.758.47-.835 1.103-1.495 1.9-1.98.797-.485 1.663-.728 2.597-.728h.264z" />
          </svg>
          支付宝支付
        </CardTitle>
        <CardDescription>
          {billingCycle === "monthly" ? "月度会员" : "年度会员"} - ¥{formatAmount(amount)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center space-y-6">
        {/* 订单信息 */}
        <div className="w-full p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">订单号</span>
            <span className="text-sm font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">商品</span>
            <span className="text-sm">
              AI教师助手{billingCycle === "monthly" ? "月度" : "年度"}会员
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">金额</span>
            <span className="text-lg font-bold text-primary">
              ¥{formatAmount(amount)}
            </span>
          </div>
        </div>

        {/* 支付按钮 */}
        {!hasSubmitted ? (
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-500 hover:bg-blue-600"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在跳转...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                前往支付宝支付
              </>
            )}
          </Button>
        ) : (
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm text-muted-foreground">
              正在跳转到支付宝...
            </p>
            <p className="text-xs text-muted-foreground">
              如果没有自动跳转，请点击下方按钮
            </p>
            <Button
              variant="link"
              onClick={handleSubmit}
              className="text-blue-500"
            >
              手动跳转
            </Button>
          </div>
        )}

        {/* 隐藏的表单容器 */}
        <div ref={formContainerRef} className="hidden" />

        {/* 提示 */}
        <p className="text-xs text-muted-foreground text-center">
          点击按钮后将跳转到支付宝完成支付
          <br />
          支付完成后请返回此页面
        </p>
      </CardContent>
    </Card>
  );
}
