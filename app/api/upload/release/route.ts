import { NextRequest, NextResponse } from "next/server";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分钟超时

// Next.js App Router 使用这个配置来设置请求体大小限制
export const preferredRegion = 'auto';
// 注意: App Router 的 API 路由请求体大小限制需要在 next.config.mjs 中配置

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

async function requireAdmin() {
  const result = await getAdminSession();
  if (!result.valid || !result.session) {
    throw new Error(result.error || "未授权访问");
  }
  return result.session;
}

export async function POST(req: NextRequest) {
  try {
    console.log("[release upload] 开始处理上传请求");

    // 验证管理员权限
    try {
      await requireAdmin();
      console.log("[release upload] 权限验证通过");
    } catch (authError) {
      console.error("[release upload] 权限验证失败:", authError);
      return NextResponse.json(
        { error: authError instanceof Error ? authError.message : "权限验证失败" },
        { status: 401 }
      );
    }

    // 解析 FormData
    let form;
    try {
      form = await req.formData();
      console.log("[release upload] FormData 解析成功");
    } catch (formError) {
      console.error("[release upload] FormData 解析失败:", formError);
      return NextResponse.json(
        { error: "FormData 解析失败" },
        { status: 400 }
      );
    }

    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      console.error("[release upload] 文件无效");
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    console.log("[release upload] 文件信息:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件太大，最大支持${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = form.get("fileName") as string;
    const cloudPath = `releases/${fileName}`;

    console.log("[release upload] 开始上传到CloudBase:", cloudPath);

    // 初始化 CloudBase
    let connector, app;
    try {
      connector = new CloudBaseConnector();
      await connector.initialize();
      app = connector.getApp();
      console.log("[release upload] CloudBase 初始化成功");
    } catch (initError) {
      console.error("[release upload] CloudBase 初始化失败:", initError);
      return NextResponse.json(
        { error: initError instanceof Error ? initError.message : "CloudBase 初始化失败" },
        { status: 500 }
      );
    }

    // 上传文件
    let uploadResult;
    try {
      uploadResult = await app.uploadFile({
        cloudPath,
        fileContent: buffer,
      });
      console.log("[release upload] 上传结果:", uploadResult);
    } catch (uploadError) {
      console.error("[release upload] 上传失败:", uploadError);
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : "上传失败" },
        { status: 500 }
      );
    }

    if (!uploadResult.fileID) {
      console.error("[release upload] 上传结果中没有 fileID");
      return NextResponse.json({ error: "上传失败: 未返回 fileID" }, { status: 500 });
    }

    console.log("[release upload] 上传成功:", uploadResult.fileID);

    return NextResponse.json({
      success: true,
      fileID: uploadResult.fileID
    });
  } catch (error) {
    console.error("[release upload] 未捕获的错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}
