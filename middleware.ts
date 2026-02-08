import { NextRequest, NextResponse } from "next/server";

// ==================== 常量定义 ====================

/**
 * 管理员会话 Cookie 名称
 */
const ADMIN_SESSION_COOKIE_NAME = "admin_session";

/**
 * 管理员会话密钥
 */
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET || "admin-secret-key-change-in-production";

// ==================== 管理员会话验证 ====================

/**
 * 验证管理员会话令牌（Edge Runtime 兼容版本）
 *
 * 使用简化的 Base64 签名验证（与服务端保持一致）
 */
function verifyAdminSessionToken(token: string): boolean {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return false;

    // 验证签名 - 与服务端 serializeSession 保持一致
    const expectedSig = Buffer.from(
      `${encoded}.${ADMIN_SESSION_SECRET}`
    ).toString("base64").slice(0, 16);

    if (sig !== expectedSig) return false;

    // 解析会话数据
    const payload = atob(encoded);
    const session = JSON.parse(payload);

    // 检查是否过期
    const now = Math.floor(Date.now() / 1000);
    if (now > session.expiresAt) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("验证管理员会话失败:", error);
    return false;
  }
}

// ==================== 中间件主逻辑 ====================

/**
 * Next.js 中间件
 *
 * 功能：
 * 1. 管理员路由保护 (/admin/*)
 * 2. CORS 处理
 * 3. 请求体大小限制
 * 4. Debug 模式安全检查
 *
 * @param request - Next.js 请求对象
 * @returns Next.js 响应对象
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // =====================
  // 管理员路由保护
  // =====================
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!sessionToken || !verifyAdminSessionToken(sessionToken)) {
      // 未登录或会话无效，重定向到登录页
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // =====================
  // 版本隔离：根据 NEXT_PUBLIC_DEPLOYMENT_REGION 限制可访问的 API 路由
  // - 国内版(CN)：禁止访问国际版 API
  // - 国际版(INTL)：禁止访问国内版 API
  // =====================
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "INTL";
  const isDomesticVersion = region === "CN";

  // 国内版：禁止访问国际版 API
  if (isDomesticVersion) {
    if (pathname.startsWith("/api/international") ||
        pathname.startsWith("/api/payment/stripe") ||
        pathname.startsWith("/api/payment/paypal")) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // 国际版：禁止访问国内版 API
  if (!isDomesticVersion) {
    if (pathname.startsWith("/api/domestic") ||
        pathname.startsWith("/api/payment/wechat") ||
        pathname.startsWith("/api/payment/alipay") ||
        pathname.startsWith("/api/payment/webhook/wechat") ||
        pathname.startsWith("/api/payment/webhook/alipay")) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // =====================
  // CORS 预检统一处理（仅 API 路由）
  // =====================
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);

    // 预检请求快速返回
    if (request.method === "OPTIONS") {
      if (isAllowedOrigin) {
        return new NextResponse(null, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        });
      }
      // 非白名单直接拒绝
      return new NextResponse(null, {
        status: 403,
        headers: {
          "Access-Control-Allow-Origin": "null",
        },
      });
    }
  }

  // =====================
  // 跳过静态资源和 Next.js 内部路由
  // =====================
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    (pathname.includes(".") && !pathname.startsWith("/api/"))
  ) {
    return NextResponse.next();
  }

  // =====================
  // 请求体大小限制 (500MB) - 仅 API 路由
  // =====================
  if (pathname.startsWith("/api/") && request.method === "POST") {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 500 * 1024 * 1024) {
      return new NextResponse(
        JSON.stringify({
          error: "Request body too large",
          message: "Maximum request size is 500MB",
        }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // =====================
  // Debug 模式安全检查
  // =====================
  const debugParam = searchParams.get("debug");
  const isDevelopment = process.env.NODE_ENV === "development";

  // 生产环境禁止调试模式访问
  if (debugParam && !isDevelopment) {
    console.warn(`生产环境检测到调试模式参数，已禁止访问: ${debugParam}`);
    return new NextResponse(
      JSON.stringify({
        error: "Access Denied",
        message: "Debug mode is not allowed in production.",
        code: "DEBUG_MODE_BLOCKED",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Blocked": "true",
        },
      }
    );
  }

  // 如果是 API 请求，也检查 Referer 中的 debug 参数
  if (pathname.startsWith("/api/") && !isDevelopment) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererDebug = refererUrl.searchParams.get("debug");

        // 生产环境禁用来自 referer 的调试模式
        if (refererDebug) {
          console.warn(
            `生产环境检测到来自 referer 的调试模式参数，已禁止访问: ${refererDebug}`
          );
          return new NextResponse(
            JSON.stringify({
              error: "Access Denied",
              message: "Debug mode is not allowed in production.",
              code: "DEBUG_MODE_BLOCKED",
            }),
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Blocked": "true",
              },
            }
          );
        }
      } catch (error) {
        // Ignore URL parsing errors
      }
    }
  }

  // =====================
  // 为响应添加 CORS 头（如果需要）
  // =====================
  const response = NextResponse.next();

  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
  }

  return response;
}

// ==================== 中间件配置 ====================

/**
 * 中间件匹配规则
 *
 * 匹配所有路径，包括 API 路由
 * 排除 Next.js 内部路由和静态文件
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，包括 API 路由
     * 排除：
     * - Next.js 内部路由 (/_next/...)
     * - 静态文件 (favicon.ico 等)
     */
    "/((?!_next/|favicon.ico).*)",
  ],
};
