import { NextRequest, NextResponse } from "next/server";
import { isChinaRegion } from "@/lib/config/region";

/**
 * GET /api/auth/wechat/qrcode
 * 返回微信扫码登录的二维码 URL
 * 可选 query: next 用于回跳后跳转
 */
export async function GET(request: NextRequest) {
  try {
    // 版本隔离：仅中国区域支持微信扫码登录
    if (!isChinaRegion()) {
      return NextResponse.json(
        { error: "WeChat QR code login only available in China region", code: "REGION_NOT_SUPPORTED" },
        { status: 400 }
      );
    }

    const appId = process.env.WECHAT_OPEN_APPID || process.env.WECHAT_APP_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appId || !appUrl) {
      return NextResponse.json(
        { error: "WeChat config missing", code: "CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const next = request.nextUrl.searchParams.get("next") || "/";
    const statePayload = JSON.stringify({ next });
    const state = Buffer.from(statePayload).toString("base64url");
    const redirectUri = `${appUrl}/api/auth/wechat/callback`;

    const qrcodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

    return NextResponse.json({
      success: true,
      qrcodeUrl,
      redirectUri,
      state,
    });
  } catch (error) {
    console.error("[auth/wechat/qrcode] error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
