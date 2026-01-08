import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/cloudbase/cloudbase-service";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未提供认证信息" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const verifyResult = verifyJwtToken(token);
    if (!verifyResult.valid || !verifyResult.payload) {
      return NextResponse.json({ error: "无效的认证令牌" }, { status: 401 });
    }

    const { userId } = verifyResult.payload;

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择要上传的图片" }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WebP 格式的图片" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "图片大小不能超过 2MB" },
        { status: 400 }
      );
    }

    // 转换文件为 base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // 更新用户头像到数据库
    const app = getCloudBaseApp();
    const db = app.database();

    await db.collection(CLOUDBASE_COLLECTIONS.WEB_USERS).doc(userId).update({
      avatar: dataUrl,
      updated_at: new Date().toISOString(),
    });

    console.log(`[Avatar] 用户 ${userId} 头像更新成功`);

    return NextResponse.json({
      success: true,
      avatar: dataUrl,
      message: "头像更新成功",
    });
  } catch (error: any) {
    console.error("[/api/auth/avatar] Error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
