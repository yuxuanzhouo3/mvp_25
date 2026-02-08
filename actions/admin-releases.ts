"use server";

/**
 * 发布版本管理 Server Actions
 * 实现双端同步：Supabase (国际版) + CloudBase (国内版)
 * 专注于移动端/桌面应用版本管理
 */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";
import { getAdminSession } from "@/lib/admin/session";
import { revalidatePath } from "next/cache";

// 平台类型
export type Platform = "ios" | "android" | "windows" | "macos" | "linux";

// 变体类型（针对不同架构/格式）
export type Variant =
  | "default"
  // macOS
  | "intel" | "m"
  // Windows
  | "x64" | "x86" | "arm64"
  // Linux
  | "deb" | "appimage" | "snap" | "flatpak" | "aur" | "rpm";

// 发布版本类型定义
export interface AppRelease {
  id: string;
  version: string;
  platform: Platform;
  variant?: Variant;
  file_url: string;
  file_size?: number;
  release_notes?: string;
  is_active: boolean;
  is_mandatory: boolean;
  created_at: string;
  updated_at?: string;
  source: "supabase" | "cloudbase" | "both";
}

export interface CreateReleaseResult {
  success: boolean;
  error?: string;
  data?: AppRelease;
}

export interface UpdateReleaseResult {
  success: boolean;
  error?: string;
}

export interface DeleteReleaseResult {
  success: boolean;
  error?: string;
}

export interface ListReleasesResult {
  success: boolean;
  error?: string;
  data?: AppRelease[];
}

/**
 * 验证管理员权限
 */
async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("未授权访问");
  }
  return session;
}

/**
 * 获取 CloudBase 客户端
 */
async function getCloudBase() {
  const connector = new CloudBaseConnector();
  await connector.initialize();
  return {
    db: connector.getClient(),
    app: connector.getApp(),
  };
}

/**
 * 上传文件到 Supabase Storage
 */
async function uploadToSupabase(
  file: File,
  fileName: string
): Promise<string | null> {
  if (!supabaseAdmin) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${fileName}`;

    const { error } = await supabaseAdmin.storage
      .from("releases")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    // 获取公开 URL
    const { data: urlData } = supabaseAdmin.storage
      .from("releases")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Supabase upload exception:", err);
    return null;
  }
}

/**
 * 上传文件到 CloudBase Storage - 使用API路由避免Server Actions限制
 */
async function uploadToCloudBase(
  file: File,
  fileName: string
): Promise<string | null> {
  try {
    // 检查文件大小（最大500MB）
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size);
      throw new Error("文件太大，最大支持500MB");
    }

    console.log("CloudBase uploading via API:", {
      fileSize: file.size,
      fileName
    });

    // 使用API路由上传，避免Server Actions的FormData限制
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const response = await fetch("/api/upload/release", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "上传失败");
    }

    const result = await response.json();
    console.log("CloudBase upload success:", result.fileID);
    return result.fileID;
  } catch (err) {
    console.error("CloudBase upload exception:", err);
    throw err;
  }
}

/**
 * 创建发布版本 - 支持选择上传目标
 */
export async function createRelease(
  formData: FormData
): Promise<CreateReleaseResult> {
  try {
    console.log("[createRelease] 函数开始执行");
    await requireAdmin();
    console.log("[createRelease] 权限验证通过");

    console.log("[createRelease] 开始读取FormData");
    const version = formData.get("version") as string;
    const platform = formData.get("platform") as Platform;
    const variant = (formData.get("variant") as Variant) || undefined;
    const releaseNotes = formData.get("releaseNotes") as string;
    const isActive = formData.get("isActive") === "true";
    const isMandatory = formData.get("isMandatory") === "true";
    const uploadTarget = (formData.get("uploadTarget") as string) || "both";

    // 关键修复: 文件已经通过API路由上传,这里只接收fileID和元数据
    const cloudbaseFileId = formData.get("cloudbaseFileId") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileSizeStr = formData.get("fileSize") as string | null;
    const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : 0;

    console.log("[createRelease] FormData读取完成:", {
      version,
      platform,
      variant,
      uploadTarget,
      hasCloudbaseFileId: !!cloudbaseFileId,
      fileName,
      fileSize
    });

    if (!version || !platform) {
      return { success: false, error: "请填写必要字段" };
    }

    if (!cloudbaseFileId) {
      return { success: false, error: "文件上传失败,请重试" };
    }

    console.log("[createRelease] 验证通过，准备写入数据库");

    // 文件已经上传到CloudBase,现在根据uploadTarget决定是否也需要上传到Supabase
    let supabaseUrl: string | null = null;
    let cloudbaseUrl: string | null = cloudbaseFileId;

    // 如果需要同时上传到Supabase,需要从CloudBase下载文件再上传
    if (uploadTarget === "both" || uploadTarget === "supabase") {
      try {
        // 从CloudBase获取文件
        const { app } = await getCloudBase();
        const downloadResult = await app.downloadFile({
          fileID: cloudbaseFileId,
        });

        if (downloadResult.fileContent) {
          // 创建File对象用于上传到Supabase
          const buffer = Buffer.from(downloadResult.fileContent);
          const blob = new Blob([buffer]);
          const file = new File([blob], fileName || "release-file", {
            type: "application/octet-stream",
          });

          supabaseUrl = await uploadToSupabase(file, fileName || `${platform}-${version}-${Date.now()}`);
          if (!supabaseUrl && uploadTarget === "supabase") {
            return { success: false, error: "上传到 Supabase 失败" };
          }
        }
      } catch (err) {
        console.error("[createRelease] Supabase上传失败:", err);
        if (uploadTarget === "supabase") {
          return { success: false, error: "上传到 Supabase 失败" };
        }
      }
    }

    console.log("[createRelease] 文件处理完成，准备写入数据库");

    // 生成 UUID
    const id = crypto.randomUUID();

    // 根据选择写入对应数据库
    const results: { supabase?: { error: unknown }; cloudbase?: { error: unknown } } = {};

    if ((uploadTarget === "both" || uploadTarget === "supabase") && supabaseUrl) {
      const supabaseResult = supabaseAdmin
        ? await supabaseAdmin.from("releases").insert({
            id,
            version,
            platform,
            variant: variant || null,
            file_url: supabaseUrl,
            file_size: fileSize,
            release_notes: releaseNotes || null,
            is_active: isActive,
            is_mandatory: isMandatory,
          })
        : { error: new Error("Supabase not configured") };
      results.supabase = supabaseResult;

      if (supabaseResult.error) {
        console.error("Supabase insert error:", supabaseResult.error);
        if (uploadTarget === "supabase") {
          return { success: false, error: "保存到 Supabase 失败" };
        }
        // 双端模式下 Supabase 插入失败，返回错误
        if (uploadTarget === "both") {
          return { success: false, error: "保存到 Supabase 失败，请检查数据库配置" };
        }
      }
    }

    if ((uploadTarget === "both" || uploadTarget === "cloudbase") && cloudbaseUrl) {
      try {
        const { db } = await getCloudBase();
        // 使用 doc(id).set() 确保使用我们指定的 ID，而不是 add() 自动生成的 ID
        await db.collection("releases").doc(id).set({
          version,
          platform,
          variant: variant || null,
          file_url: cloudbaseUrl,
          file_size: fileSize,
          release_notes: releaseNotes || null,
          is_active: isActive,
          is_mandatory: isMandatory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        results.cloudbase = { error: null };
      } catch (err) {
        console.error("CloudBase insert error:", err);
        results.cloudbase = { error: err };
        if (uploadTarget === "cloudbase") {
          return { success: false, error: "保存到 CloudBase 失败" };
        }
        // 双端模式下 CloudBase 插入失败，返回错误
        if (uploadTarget === "both") {
          return { success: false, error: "保存到 CloudBase 失败，请检查数据库配置" };
        }
      }
    }

    // 检查是否至少有一个成功
    const supabaseSuccess = !results.supabase?.error;
    const cloudbaseSuccess = !results.cloudbase?.error;

    if (uploadTarget === "both" && !supabaseSuccess && !cloudbaseSuccess) {
      return { success: false, error: "保存到数据库失败" };
    }

    revalidatePath("/admin/releases");

    // 确定数据源
    let source: "supabase" | "cloudbase" | "both" = "both";
    if (uploadTarget === "supabase") {
      source = "supabase";
    } else if (uploadTarget === "cloudbase") {
      source = "cloudbase";
    }

    return {
      success: true,
      data: {
        id,
        version,
        platform,
        variant,
        file_url: supabaseUrl || cloudbaseUrl || "",
        file_size: fileSize,
        release_notes: releaseNotes || undefined,
        is_active: isActive,
        is_mandatory: isMandatory,
        created_at: new Date().toISOString(),
        source,
      },
    };
  } catch (err) {
    console.error("Create release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建发布版本失败",
    };
  }
}

/**
 * 获取发布版本列表（合并 Supabase 和 CloudBase）
 */
export async function listReleases(): Promise<ListReleasesResult> {
  try {
    await requireAdmin();

    const releasesMap = new Map<string, AppRelease>();

    // 从 Supabase 获取
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("releases")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          for (const release of data) {
            releasesMap.set(release.id, {
              ...release,
              source: "supabase" as const,
            });
          }
        }
      } catch (err) {
        console.warn("Supabase list warning:", err);
      }
    }

    // 从 CloudBase 获取
    try {
      const connector = new CloudBaseConnector();
      await connector.initialize();
      const db = connector.getClient();
      const app = connector.getApp();

      const { data } = await db
        .collection("releases")
        .orderBy("created_at", "desc")
        .get();

      console.log("CloudBase releases count:", data?.length || 0);

      if (data && Array.isArray(data)) {
        // 收集需要获取临时 URL 的 fileID
        const cloudbaseReleases: { release: any; fileId: string }[] = [];

        for (const release of data) {
          const id = release._id || release.id;
          let fileId: string | null = null;

          // 检查 file_url 是否是 fileID 格式
          if (release.file_url && release.file_url.startsWith("cloud://")) {
            fileId = release.file_url;
          }

          if (releasesMap.has(id)) {
            // 两边都有，标记为 both
            const existing = releasesMap.get(id)!;
            releasesMap.set(id, { ...existing, source: "both" });
          } else {
            // 只在 CloudBase 有
            releasesMap.set(id, {
              id,
              version: release.version,
              platform: release.platform,
              variant: release.variant,
              file_url: release.file_url,
              file_size: release.file_size,
              release_notes: release.release_notes,
              is_active: release.is_active,
              is_mandatory: release.is_mandatory,
              created_at: release.created_at,
              updated_at: release.updated_at,
              source: "cloudbase" as const,
            });

            if (fileId) {
              cloudbaseReleases.push({ release: { ...release, id }, fileId });
            }
          }
        }

        // 批量获取 CloudBase 文件的临时 URL
        if (cloudbaseReleases.length > 0) {
          try {
            const fileIds = cloudbaseReleases.map((item) => item.fileId);
            const urlResult = await app.getTempFileURL({
              fileList: fileIds,
            });

            if (urlResult.fileList && Array.isArray(urlResult.fileList)) {
              const urlMap = new Map<string, string>();
              for (const fileInfo of urlResult.fileList) {
                if (fileInfo.tempFileURL && fileInfo.code === "SUCCESS") {
                  urlMap.set(fileInfo.fileID, fileInfo.tempFileURL);
                }
              }

              // 更新 releasesMap 中的 file_url
              for (const { release, fileId } of cloudbaseReleases) {
                const tempUrl = urlMap.get(fileId);
                if (tempUrl) {
                  const existing = releasesMap.get(release.id);
                  if (existing) {
                    releasesMap.set(release.id, { ...existing, file_url: tempUrl });
                  }
                }
              }
            }
          } catch (urlErr) {
            console.error("CloudBase getTempFileURL error:", urlErr);
          }
        }
      }
    } catch (err) {
      console.error("CloudBase list error:", err);
    }

    // 转换为数组并排序
    const releases = Array.from(releasesMap.values()).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { success: true, data: releases };
  } catch (err) {
    console.error("List releases error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取发布版本列表失败",
    };
  }
}

/**
 * 更新发布版本 - 双端同步
 */
export async function updateRelease(
  id: string,
  formData: FormData
): Promise<UpdateReleaseResult> {
  try {
    await requireAdmin();

    const releaseNotes = formData.get("releaseNotes") as string;
    const isActive = formData.get("isActive") === "true";
    const isMandatory = formData.get("isMandatory") === "true";

    const updates = {
      release_notes: releaseNotes || null,
      is_active: isActive,
      is_mandatory: isMandatory,
      updated_at: new Date().toISOString(),
    };

    // 并发更新两个数据库
    const supabasePromise = supabaseAdmin
      ? supabaseAdmin.from("releases").update(updates).eq("id", id)
      : Promise.resolve({ error: new Error("Supabase not configured") });

    const cloudbasePromise = (async () => {
      try {
        const { db } = await getCloudBase();
        await db.collection("releases").doc(id).update(updates);
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    })();

    const [supabaseResult, cloudbaseResult] = await Promise.all([
      supabasePromise,
      cloudbasePromise,
    ]);

    // 至少一个数据库更新成功即可
    const hasSupabaseSuccess = !supabaseResult.error;
    const hasCloudBaseSuccess = !cloudbaseResult.error;

    if (!hasSupabaseSuccess && !hasCloudBaseSuccess) {
      console.error("Both databases failed to update");
      return { success: false, error: "更新失败" };
    }

    if (!hasSupabaseSuccess) {
      console.warn("Supabase update warning:", supabaseResult.error);
    }

    if (!hasCloudBaseSuccess) {
      console.warn("CloudBase update warning:", cloudbaseResult.error);
    }

    revalidatePath("/admin/releases");

    return { success: true };
  } catch (err) {
    console.error("Update release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新发布版本失败",
    };
  }
}

/**
 * 切换发布版本状态（启用/禁用）- 双端同步
 */
export async function toggleReleaseStatus(
  id: string,
  isActive: boolean
): Promise<UpdateReleaseResult> {
  try {
    await requireAdmin();

    const updates = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // 并发更新两个数据库
    const supabasePromise = supabaseAdmin
      ? supabaseAdmin.from("releases").update(updates).eq("id", id)
      : Promise.resolve({ error: new Error("Supabase not configured") });

    const cloudbasePromise = (async () => {
      try {
        const { db } = await getCloudBase();
        await db.collection("releases").doc(id).update(updates);
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    })();

    const [supabaseResult, cloudbaseResult] = await Promise.all([
      supabasePromise,
      cloudbasePromise,
    ]);

    // 至少一个数据库更新成功即可
    const hasSupabaseSuccess = !supabaseResult.error;
    const hasCloudBaseSuccess = !cloudbaseResult.error;

    if (!hasSupabaseSuccess && !hasCloudBaseSuccess) {
      console.error("Both databases failed to toggle status");
      return { success: false, error: "切换状态失败" };
    }

    if (!hasSupabaseSuccess) {
      console.warn("Supabase toggle warning:", supabaseResult.error);
    }

    if (!hasCloudBaseSuccess) {
      console.warn("CloudBase toggle warning:", cloudbaseResult.error);
    }

    revalidatePath("/admin/releases");

    return { success: true };
  } catch (err) {
    console.error("Toggle release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "切换状态失败",
    };
  }
}

/**
 * 删除发布版本 - 双端同步（硬删除）
 */
export async function deleteRelease(id: string): Promise<DeleteReleaseResult> {
  try {
    await requireAdmin();

    // 先获取版本信息以便删除存储文件
    let fileUrl: string | null = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("releases")
        .select("file_url")
        .eq("id", id)
        .single();
      fileUrl = data?.file_url;
    }

    // 并发删除两个数据库的记录
    const supabasePromise = supabaseAdmin
      ? supabaseAdmin.from("releases").delete().eq("id", id)
      : Promise.resolve({ error: new Error("Supabase not configured") });

    const cloudbasePromise = (async () => {
      try {
        const { db } = await getCloudBase();
        await db.collection("releases").doc(id).remove();
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    })();

    const [supabaseResult, cloudbaseResult] = await Promise.all([
      supabasePromise,
      cloudbasePromise,
    ]);

    // 优先使用Supabase，如果Supabase删除失败，直接返回失败
    if (supabaseResult.error) {
      console.error("Supabase delete error:", supabaseResult.error);
      return { success: false, error: "删除失败" };
    }

    // CloudBase删除失败只记录警告
    if (cloudbaseResult.error) {
      console.warn("CloudBase delete warning:", cloudbaseResult.error);
    }

    // 尝试删除存储文件（可选，不影响主流程）
    if (fileUrl && supabaseAdmin) {
      try {
        const urlParts = fileUrl.split("/releases/");
        if (urlParts.length > 1) {
          const fileName = urlParts[1].split("?")[0];
          await supabaseAdmin.storage.from("releases").remove([fileName]);
        }
      } catch (err) {
        console.warn("Delete storage file warning:", err);
      }
    }

    revalidatePath("/admin/releases");

    return { success: true };
  } catch (err) {
    console.error("Delete release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除发布版本失败",
    };
  }
}

/**
 * 获取最新版本（按平台）
 * 用于客户端检查更新
 */
export async function getLatestRelease(
  platform: Platform
): Promise<{ success: boolean; data?: AppRelease; error?: string }> {
  try {
    // 从 Supabase 获取
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("releases")
        .select("*")
        .eq("platform", platform)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return {
          success: true,
          data: {
            ...data,
            source: "supabase" as const,
          },
        };
      }
    }

    // 如果 Supabase 没有，尝试从 CloudBase 获取
    try {
      const { db, app } = await getCloudBase();
      const { data } = await db
        .collection("releases")
        .where({
          platform,
          is_active: true,
        })
        .orderBy("created_at", "desc")
        .limit(1)
        .get();

      if (data && data.length > 0) {
        const release = data[0];

        // 如果是 cloud:// 格式，获取临时 URL
        let fileUrl = release.file_url;
        if (fileUrl && fileUrl.startsWith("cloud://")) {
          try {
            const urlResult = await app.getTempFileURL({
              fileList: [fileUrl],
            });
            if (urlResult.fileList?.[0]?.code === "SUCCESS") {
              fileUrl = urlResult.fileList[0].tempFileURL;
            }
          } catch {
            // 使用原 URL
          }
        }

        return {
          success: true,
          data: {
            id: release._id || release.id,
            version: release.version,
            platform: release.platform,
            variant: release.variant,
            file_url: fileUrl,
            file_size: release.file_size,
            release_notes: release.release_notes,
            is_active: release.is_active,
            is_mandatory: release.is_mandatory,
            created_at: release.created_at,
            updated_at: release.updated_at,
            source: "cloudbase" as const,
          },
        };
      }
    } catch (err) {
      console.error("CloudBase getLatestRelease error:", err);
    }

    return { success: false, error: "未找到可用版本" };
  } catch (err) {
    console.error("Get latest release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取最新版本失败",
    };
  }
}

// ============================================================================
// 文件管理相关
// ============================================================================

export interface ReleaseFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  source: "supabase" | "cloudbase";
  fileId?: string;
  releaseId?: string;
  version?: string;
  platform?: Platform;
}

export interface ListReleaseFilesResult {
  success: boolean;
  error?: string;
  supabaseFiles?: ReleaseFile[];
  cloudbaseFiles?: ReleaseFile[];
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  error?: string;
  data?: string;
  contentType?: string;
  fileName?: string;
}

/**
 * 列出发布版本文件 - 两个云存储
 */
export async function listReleaseFiles(): Promise<ListReleaseFilesResult> {
  try {
    await requireAdmin();

    const supabaseFiles: ReleaseFile[] = [];
    const cloudbaseFiles: ReleaseFile[] = [];

    // 获取 Supabase Storage 文件
    if (supabaseAdmin) {
      try {
        // 获取 releases bucket 文件列表
        const { data: files, error } = await supabaseAdmin.storage
          .from("releases")
          .list("", { limit: 100 });

        if (!error && files) {
          // 同时获取数据库中的版本信息
          const { data: releases } = await supabaseAdmin
            .from("releases")
            .select("id, version, platform, file_url, file_size, created_at");

          // 创建 URL -> release 映射
          const urlToRelease = new Map<string, any>();
          if (releases) {
            for (const release of releases) {
              if (release.file_url) {
                const urlParts = release.file_url.split("/releases/");
                if (urlParts.length > 1) {
                  const fileName = decodeURIComponent(urlParts[1].split("?")[0]);
                  urlToRelease.set(fileName, release);
                }
              }
            }
          }

          for (const file of files) {
            if (file.name === ".emptyFolderPlaceholder") continue;

            const { data: urlData } = supabaseAdmin.storage
              .from("releases")
              .getPublicUrl(file.name);

            const release = urlToRelease.get(file.name);

            supabaseFiles.push({
              name: file.name,
              url: urlData.publicUrl,
              size: release?.file_size || file.metadata?.size,
              lastModified: release?.created_at || file.updated_at,
              source: "supabase",
              releaseId: release?.id,
              version: release?.version,
              platform: release?.platform,
            });
          }
        }
      } catch (err) {
        console.warn("List Supabase release files warning:", err);
      }
    }

    // 获取 CloudBase Storage 文件
    try {
      const connector = new CloudBaseConnector();
      await connector.initialize();
      const db = connector.getClient();
      const app = connector.getApp();

      const { data } = await db.collection("releases").get();

      if (data && Array.isArray(data)) {
        const fileIdList: string[] = [];
        const releaseMap: Map<string, { release: any; fileName: string }> = new Map();

        for (const release of data) {
          if (release.file_url) {
            let fileId: string | null = null;
            let fileName: string;

            if (release.file_url.startsWith("cloud://")) {
              fileId = release.file_url;
              const pathParts = release.file_url.split("/");
              fileName = pathParts[pathParts.length - 1] || release._id;
            } else {
              const urlParts = release.file_url.split("/");
              fileName = urlParts[urlParts.length - 1]?.split("?")[0] || release._id;

              cloudbaseFiles.push({
                name: fileName,
                url: release.file_url,
                size: release.file_size,
                lastModified: release.created_at,
                source: "cloudbase",
                fileId: undefined,
                releaseId: release._id || release.id,
                version: release.version,
                platform: release.platform,
              });
              continue;
            }

            if (fileId) {
              fileIdList.push(fileId);
              releaseMap.set(fileId, { release, fileName });
            }
          }
        }

        // 批量获取临时访问 URL
        if (fileIdList.length > 0) {
          try {
            const urlResult = await app.getTempFileURL({
              fileList: fileIdList,
            });

            if (urlResult.fileList && Array.isArray(urlResult.fileList)) {
              for (const fileInfo of urlResult.fileList) {
                const mapEntry = releaseMap.get(fileInfo.fileID);
                if (mapEntry) {
                  const { release, fileName } = mapEntry;
                  const isSuccess = fileInfo.code === "SUCCESS" && fileInfo.tempFileURL;
                  const displayUrl = isSuccess ? fileInfo.tempFileURL : release.file_url;

                  cloudbaseFiles.push({
                    name: fileName,
                    url: displayUrl,
                    size: release.file_size,
                    lastModified: release.created_at,
                    source: "cloudbase",
                    fileId: fileInfo.fileID,
                    releaseId: release._id || release.id,
                    version: release.version,
                    platform: release.platform,
                  });

                  releaseMap.delete(fileInfo.fileID);
                }
              }
            }

            // 处理未能获取临时 URL 的文件
            for (const [fileId, { release, fileName }] of releaseMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: release.file_url,
                size: release.file_size,
                lastModified: release.created_at,
                source: "cloudbase",
                fileId: fileId,
                releaseId: release._id || release.id,
                version: release.version,
                platform: release.platform,
              });
            }
          } catch (urlErr) {
            console.error("CloudBase getTempFileURL error:", urlErr);
            for (const [fileId, { release, fileName }] of releaseMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: release.file_url,
                size: release.file_size,
                lastModified: release.created_at,
                source: "cloudbase",
                fileId: fileId,
                releaseId: release._id || release.id,
                version: release.version,
                platform: release.platform,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("List CloudBase release files error:", err);
    }

    return {
      success: true,
      supabaseFiles,
      cloudbaseFiles,
    };
  } catch (err) {
    console.error("List release files error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取文件列表失败",
    };
  }
}

/**
 * 删除发布版本文件
 */
export async function deleteReleaseFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string,
  releaseId?: string
): Promise<FileOperationResult> {
  try {
    await requireAdmin();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      // 删除存储文件
      const { error } = await supabaseAdmin.storage
        .from("releases")
        .remove([fileName]);

      if (error) {
        console.error("Supabase delete file error:", error);
        return { success: false, error: "删除文件失败" };
      }

      // 如果有关联的版本记录，也删除
      if (releaseId) {
        await supabaseAdmin.from("releases").delete().eq("id", releaseId);
      }
    } else if (source === "cloudbase") {
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        // 删除版本记录
        if (releaseId) {
          try {
            await db.collection("releases").doc(releaseId).remove();
          } catch (dbErr) {
            console.warn("CloudBase delete release record warning:", dbErr);
          }
        }

        // 删除存储文件
        if (fileId && fileId.startsWith("cloud://")) {
          try {
            await app.deleteFile({ fileList: [fileId] });
          } catch (fileErr) {
            console.warn("CloudBase delete file warning:", fileErr);
          }
        }
      } catch (err) {
        console.error("CloudBase delete error:", err);
        return { success: false, error: "删除 CloudBase 文件失败" };
      }
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/releases");
    return { success: true };
  } catch (err) {
    console.error("Delete release file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除文件失败",
    };
  }
}

/**
 * 下载发布版本文件
 */
export async function downloadReleaseFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string
): Promise<DownloadResult> {
  try {
    await requireAdmin();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data, error } = await supabaseAdmin.storage
        .from("releases")
        .download(fileName);

      if (error || !data) {
        console.error("Supabase download error:", error);
        return { success: false, error: "下载文件失败" };
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return {
        success: true,
        data: buffer.toString("base64"),
        contentType: data.type,
        fileName,
      };
    } else if (source === "cloudbase") {
      if (!fileId || !fileId.startsWith("cloud://")) {
        return { success: false, error: "无效的 CloudBase fileId" };
      }

      const connector = new CloudBaseConnector();
      await connector.initialize();
      const app = connector.getApp();

      const downloadResult = await app.downloadFile({
        fileID: fileId,
      });

      if (!downloadResult.fileContent) {
        console.error("CloudBase download failed: no fileContent");
        return { success: false, error: "下载文件失败" };
      }

      const buffer = Buffer.from(downloadResult.fileContent);

      // 根据文件扩展名推断 contentType
      const ext = fileName.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";
      if (ext) {
        const mimeTypes: Record<string, string> = {
          apk: "application/vnd.android.package-archive",
          ipa: "application/octet-stream",
          exe: "application/x-msdownload",
          dmg: "application/x-apple-diskimage",
          deb: "application/vnd.debian.binary-package",
          rpm: "application/x-rpm",
          zip: "application/zip",
          appimage: "application/x-executable",
        };
        contentType = mimeTypes[ext] || contentType;
      }

      return {
        success: true,
        data: buffer.toString("base64"),
        contentType,
        fileName,
      };
    }

    return { success: false, error: "不支持的数据源" };
  } catch (err) {
    console.error("Download release file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "下载文件失败",
    };
  }
}
