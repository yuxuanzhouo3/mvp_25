"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WechatLoginButtonProps {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

// 微信 Logo SVG
function WechatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.004-.27-.022-.407-.032zM13.12 12.07c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  )
}

export function WechatLoginButton({
  onSuccess,
  onError,
  className,
  disabled = false,
}: WechatLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // 注册全局回调函数，用于接收 Android 端传回的登录数据
  useEffect(() => {
    console.log("[WECHAT BUTTON] 注册全局回调函数");

    // @ts-ignore
    window.onWeChatLoginSuccess = (code: string) => {
      alert(`[调试] Android微信登录成功!\n授权码: ${code.substring(0, 20)}...`);
      console.log("[WECHAT BUTTON] ========== Android微信登录成功回调 ==========");
      console.log("[WECHAT BUTTON] 收到微信授权码:", code);

      // 把 code 传给后端 API，让后端去换取 accessToken
      // state=/dashboard 表示登录成功后跳转到 dashboard 页面
      // source=app 表示这是APP端登录
      const callbackUrl = `/api/auth/wechat/callback?code=${code}&state=/dashboard&source=app`;
      console.log("[WECHAT BUTTON] 准备跳转到回调URL:", callbackUrl);
      alert(`[调试] 准备跳转到:\n${callbackUrl}`);
      window.location.href = callbackUrl;
    };

    // @ts-ignore
    window.onWeChatLoginError = (error: string) => {
      alert(`[调试] Android微信登录失败!\n错误: ${error}`);
      console.error("[WECHAT BUTTON] ========== Android微信登录失败 ==========");
      console.error("[WECHAT BUTTON] 错误信息:", error);

      // 调用错误回调
      if (onError) {
        onError(error);
      }
    };

    // 清理函数
    return () => {
      // @ts-ignore
      delete window.onWeChatLoginSuccess;
      // @ts-ignore
      delete window.onWeChatLoginError;
    };
  }, [onSuccess, onError]);

  // 处理小程序登录
  const handleMiniprogramLogin = async (code: string) => {
    setIsLoading(true);

    try {
      console.log('[WECHAT BUTTON] 调用小程序登录API...');
      const response = await fetch('/api/auth/wechat/miniprogram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      console.log('[WECHAT BUTTON] API响应状态:', response.status);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '小程序登录失败');
      }

      console.log('[WECHAT BUTTON] 登录成功，保存tokens');

      // 保存 tokens
      localStorage.setItem('auth_tokens', JSON.stringify({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.tokenMeta?.accessTokenExpiresIn || 3600) * 1000
      }));
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      console.log('[WECHAT BUTTON] 跳转到dashboard');

      // 跳转到 dashboard
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('[WECHAT BUTTON] 小程序登录失败:', error);
      if (onError) {
        onError(error.message || '小程序登录失败，请重试');
      }
      setIsLoading(false);
    }
  };

  // 检测小程序环境并处理登录
  useEffect(() => {
    // 只在小程序环境中运行
    if (!isMiniProgram()) return;

    console.log('[WECHAT BUTTON] 检测到小程序环境');

    // 检查 URL 中是否有 mp_code 参数
    const urlParams = new URLSearchParams(window.location.search);
    const mpCode = urlParams.get('mp_code');

    if (mpCode) {
      console.log('[WECHAT BUTTON] 从URL获取到小程序code:', mpCode);
      handleMiniprogramLogin(mpCode);
    } else {
      console.log('[WECHAT BUTTON] URL中没有mp_code参数');
    }
  }, []);

  // 检测是否在微信小程序环境中
  const isMiniProgram = () => {
    if (typeof window === 'undefined') return false;
    // 检测微信小程序环境
    return /miniProgram/i.test(navigator.userAgent) ||
           // @ts-ignore
           window.__wxjs_environment === 'miniprogram';
  };

  const handleWechatLogin = async () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.Android) {
      // 调用原生安卓微信登录
      // @ts-ignore
      window.Android.login();
    } else if (isMiniProgram()) {
      // 小程序环境：通过 postMessage 请求小程序调用 wx.login()
      console.log('[WECHAT BUTTON] 小程序环境，发送登录请求');

      // @ts-ignore
      if (typeof wx !== 'undefined' && wx.miniProgram) {
        // @ts-ignore
        wx.miniProgram.postMessage({
          data: { type: 'REQUEST_LOGIN' }
        });

        // 显示提示
        if (onError) {
          onError('正在跳转登录...');
        }
      } else {
        console.error('[WECHAT BUTTON] wx.miniProgram 不可用');
        if (onError) {
          onError('小程序环境异常，请重试');
        }
      }
    } else {
      // 网页环境：使用公众号登录
      setIsLoading(true)

      try {
        // 方法1：直接使用 GET 请求重定向到微信授权页
        const callbackUrl = encodeURIComponent(`${window.location.origin}/api/auth/wechat/callback`)
        const state = encodeURIComponent("/") // 登录成功后跳转到首页

        // 直接跳转到微信授权获取 URL
        window.location.href = `/api/auth/wechat?callback=${callbackUrl}&state=${state}`
      } catch (err: any) {
        console.error("微信登录错误:", err)
        if (onError) {
          onError(err.message || "微信登录失败，请重试")
        }
        setIsLoading(false)
      }
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full gap-2 bg-[#07C160] text-white border-[#07C160]",
        "hover:bg-[#06AD56] hover:border-[#06AD56] hover:text-white",
        "transition-colors duration-200",
        className
      )}
      onClick={handleWechatLogin}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          连接中...
        </>
      ) : (
        <>
          <WechatIcon className="w-5 h-5" />
          使用微信登录
        </>
      )}
    </Button>
  )
}
