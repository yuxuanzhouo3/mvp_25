"use server";

/**
 * 管理后台 - 广告管理 Server Actions
 *
 * 提供广告的创建、编辑、删除、列表查看等功能
 * 支持双数据库（CloudBase + Supabase）
 * 支持文件上传到云存储
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  Advertisement,
  AdFilters,
  ApiResponse,
  PaginatedResult,
  CreateAdData,
  UpdateAdData,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

// ============================================================
// 文件上传辅助函数
// ============================================================

/**
 * 上传文件到 Supabase Storage
 */
async function uploadFileToSupabase(
  file: File,
  fileName: string
): Promise<string | null> {
  if (!supabaseAdmin) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${fileName}`;

    const { error } = await supabaseAdmin.storage
      .from("ads")
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
      .from("ads")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Supabase upload exception:", err);
    return null;
  }
}

/**
 * 上传文件到 CloudBase Storage
 * 返回 fileID（用于后续获取临时 URL）
 */
async function uploadFileToCloudBase(
  file: File,
  fileName: string
): Promise<string | null> {
  try {
    const connector = new CloudBaseConnector();
    await connector.initialize();
    const app = connector.getApp();

    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudPath = `ads/${fileName}`;

    console.log("CloudBase uploading to:", cloudPath);

    // Node SDK 使用 uploadFile 方法
    const uploadResult = await app.uploadFile({
      cloudPath,
      fileContent: buffer,
    });

    console.log("CloudBase upload result:", JSON.stringify(uploadResult, null, 2));

    if (!uploadResult.fileID) {
      console.error("CloudBase upload failed: no fileID returned");
      return null;
    }

    console.log("CloudBase upload success, fileID:", uploadResult.fileID);

    // 返回 fileID
    return uploadResult.fileID;
  } catch (err) {
    console.error("CloudBase upload exception:", err);
    return null;
  }
}

/**
 * 获取 CloudBase 文件的临时访问 URL
 * 将 cloud:// fileID 转换为可访问的 HTTPS URL
 */
async function getCloudBaseTempUrls(
  ads: Advertisement[]
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  // 收集所有 CloudBase 文件 ID
  const cloudBaseFileIds: string[] = [];
  const adIndexMap = new Map<string, number>();

  for (let i = 0; i < ads.length; i++) {
    const ad = ads[i];
    if (ad.fileUrl && ad.fileUrl.startsWith("cloud://")) {
      cloudBaseFileIds.push(ad.fileUrl);
      adIndexMap.set(ad.fileUrl, i);
    }
  }

  if (cloudBaseFileIds.length === 0) {
    return urlMap;
  }

  try {
    const connector = new CloudBaseConnector();
    await connector.initialize();
    const app = connector.getApp();

    const result = await app.getTempFileURL({
      fileList: cloudBaseFileIds,
    });

    if (result.fileList && Array.isArray(result.fileList)) {
      for (const fileInfo of result.fileList) {
        if (fileInfo.code === "SUCCESS" && fileInfo.tempFileURL) {
          urlMap.set(fileInfo.fileID, fileInfo.tempFileURL);
        }
      }
    }
  } catch (error) {
    console.error("获取 CloudBase 临时 URL 失败:", error);
  }

  return urlMap;
}

/**
 * 获取广告列表
 */
export async function listAds(
  filters?: AdFilters
): Promise<ApiResponse<PaginatedResult<Advertisement>>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ads = await db.listAds(filters || {});
    const total = await db.countAds(filters || {});

    // 获取 CloudBase 文件的临时 URL
    const tempUrlMap = await getCloudBaseTempUrls(ads);

    // 将 CloudBase fileID 替换为临时 URL
    const items = ads.map((ad) => {
      if (ad.fileUrl && ad.fileUrl.startsWith("cloud://")) {
        const tempUrl = tempUrlMap.get(ad.fileUrl);
        return {
          ...ad,
          fileUrl: tempUrl || ad.fileUrl, // 如果获取临时 URL 失败，使用原 fileID
        };
      }
      return ad;
    });

    const pageSize = filters?.limit || 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;

    return {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("获取广告列表失败:", error);
    return {
      success: false,
      error: error.message || "获取广告列表失败",
    };
  }
}

/**
 * 根据 ID 获取广告详情
 */
export async function getAdById(
  adId: string
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.getAdById(adId);

    if (!ad) {
      return {
        success: false,
        error: "广告不存在",
      };
    }

    return {
      success: true,
      data: ad,
    };
  } catch (error: any) {
    console.error("获取广告详情失败:", error);
    return {
      success: false,
      error: error.message || "获取广告详情失败",
    };
  }
}

/**
 * 创建广告
 * 支持文件上传到云存储
 */
export async function createAd(
  data: CreateAdData | FormData
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    let finalData: CreateAdData;

    // 如果是 FormData，先处理文件上传
    if (data instanceof FormData) {
      const formData = data;

      const title = formData.get("title") as string;
      const type = formData.get("type") as "image" | "video";
      const position = formData.get("position") as string;
      const linkUrl = formData.get("linkUrl") as string;
      const priority = parseInt(formData.get("priority") as string) || 0;
      const status = formData.get("status") as "active" | "inactive";
      const uploadTarget = formData.get("uploadTarget") as "both" | "supabase" | "cloudbase";
      const file = formData.get("file") as File;

      if (!title || !type || !position) {
        return {
          success: false,
          error: "请填写必填字段",
        };
      }

      if (!file || file.size === 0) {
        return {
          success: false,
          error: "请上传广告文件",
        };
      }

      // 生成唯一文件名
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // 根据选择上传到对应存储
      let fileUrl = "";
      let fileSize = file.size;

      if (uploadTarget === "both" || uploadTarget === "supabase") {
        const supabaseUrl = await uploadFileToSupabase(file, fileName);
        if (!supabaseUrl && uploadTarget === "supabase") {
          return {
            success: false,
            error: "上传到 Supabase 失败",
          };
        }
        if (supabaseUrl) {
          fileUrl = supabaseUrl;
        }
      }

      if (uploadTarget === "both" || uploadTarget === "cloudbase") {
        const cloudbaseFileId = await uploadFileToCloudBase(file, fileName);
        if (!cloudbaseFileId && uploadTarget === "cloudbase") {
          return {
            success: false,
            error: "上传到 CloudBase 失败",
          };
        }
        if (cloudbaseFileId) {
          fileUrl = cloudbaseFileId;
        }
      }

      // 构造 CreateAdData
      finalData = {
        title,
        type,
        position,
        fileUrl,
        linkUrl,
        priority,
        status,
        uploadTarget,
        fileSize,
      };
    } else {
      // 直接是 CreateAdData 对象（兼容性处理）
      finalData = data as CreateAdData;
    }

    const db = await getDatabaseAdapter();
    const ad = await db.createAd(finalData);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.create",
      resource_type: "ad",
      resource_id: ad.id,
      details: { title: finalData.title, position: finalData.position },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
      data: ad,
    };
  } catch (error: any) {
    console.error("创建广告失败:", error);
    return {
      success: false,
      error: error.message || "创建广告失败",
    };
  }
}

/**
 * 更新广告
 */
export async function updateAd(
  adId: string,
  data: UpdateAdData
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.updateAd(adId, data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.update",
      resource_type: "ad",
      resource_id: adId,
      details: data,
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
      data: ad,
    };
  } catch (error: any) {
    console.error("更新广告失败:", error);
    return {
      success: false,
      error: error.message || "更新广告失败",
    };
  }
}

/**
 * 删除广告
 */
export async function deleteAd(
  adId: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();

    // 先获取广告信息用于日志
    const ad = await db.getAdById(adId);
    if (!ad) {
      return {
        success: false,
        error: "广告不存在",
      };
    }

    await db.deleteAd(adId);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.delete",
      resource_type: "ad",
      resource_id: adId,
      details: { title: ad.title },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除广告失败:", error);
    return {
      success: false,
      error: error.message || "删除广告失败",
    };
  }
}

/**
 * 切换广告状态（激活/禁用）
 */
export async function toggleAdStatus(
  adId: string
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.getAdById(adId);

    if (!ad) {
      return {
        success: false,
        error: "广告不存在",
      };
    }

    const newStatus = ad.status === "active" ? "inactive" : "active";
    const updatedAd = await db.updateAd(adId, { status: newStatus });

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.update",
      resource_type: "ad",
      resource_id: adId,
      details: { previousStatus: ad.status, newStatus },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
      data: updatedAd,
    };
  } catch (error: any) {
    console.error("切换广告状态失败:", error);
    return {
      success: false,
      error: error.message || "切换广告状态失败",
    };
  }
}

/**
 * 获取广告统计信息
 */
export async function getAdStats(): Promise<ApiResponse<{
  total: number;
  active: number;
  inactive: number;
  byPosition: Record<string, number>;
  byType: Record<string, number>;
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const allAds = await db.listAds({ limit: 10000 });

    const active = allAds.filter((ad) => ad.status === "active").length;
    const inactive = allAds.filter((ad) => ad.status === "inactive").length;

    // 按位置统计
    const byPosition: Record<string, number> = {};
    allAds.forEach((ad) => {
      byPosition[ad.position] = (byPosition[ad.position] || 0) + 1;
    });

    // 按类型统计
    const byType: Record<string, number> = {};
    allAds.forEach((ad) => {
      byType[ad.type] = (byType[ad.type] || 0) + 1;
    });

    return {
      success: true,
      data: {
        total: allAds.length,
        active,
        inactive,
        byPosition,
        byType,
      },
    };
  } catch (error: any) {
    console.error("获取广告统计失败:", error);
    return {
      success: false,
      error: error.message || "获取广告统计失败",
    };
  }
}

/**
 * 批量更新广告优先级
 */
export async function updateAdPriorities(
  updates: Array<{ id: string; priority: number }>
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    // 并发更新所有广告的优先级
    await Promise.all(
      updates.map(({ id, priority }) => db.updateAd(id, { priority }))
    );

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.update",
      resource_type: "ad",
      details: { action: "bulk_update_priority", count: updates.length },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("批量更新优先级失败:", error);
    return {
      success: false,
      error: error.message || "批量更新优先级失败",
    };
  }
}

// ============================================================
// 文件管理相关类型和函数
// ============================================================

export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  source: "supabase" | "cloudbase";
  fileId?: string;
  adId?: string;
}

export interface ListFilesResult {
  success: boolean;
  error?: string;
  supabaseFiles?: StorageFile[];
  cloudbaseFiles?: StorageFile[];
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
 * 列出存储文件 - 两个云存储
 */
export async function listStorageFiles(): Promise<ListFilesResult> {
  try {
    await requireAdminSession();

    const supabaseFiles: StorageFile[] = [];
    const cloudbaseFiles: StorageFile[] = [];

    // 获取 Supabase Storage 文件
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from("ads")
          .list("", { limit: 100 });

        if (!error && data) {
          for (const file of data) {
            const { data: urlData } = supabaseAdmin.storage
              .from("ads")
              .getPublicUrl(file.name);

            supabaseFiles.push({
              name: file.name,
              url: urlData.publicUrl,
              size: file.metadata?.size,
              lastModified: file.updated_at,
              source: "supabase",
            });
          }
        }
      } catch (err) {
        console.warn("List Supabase files warning:", err);
      }
    }

    // 获取 CloudBase Storage 文件
    try {
      const connector = new CloudBaseConnector();
      await connector.initialize();
      const db = connector.getClient();
      const app = connector.getApp();

      const { data } = await db.collection("advertisements").get();

      if (data && Array.isArray(data)) {
        const fileIdList: string[] = [];
        const adMap: Map<string, { ad: any; fileName: string }> = new Map();

        for (const ad of data) {
          // 兼容多种字段名：media_url, file_url, fileUrl
          const mediaUrl = ad.media_url || ad.file_url || ad.fileUrl;

          if (mediaUrl) {
            let fileId: string | null = null;
            let fileName: string;

            if (mediaUrl.startsWith("cloud://")) {
              // 已经是 fileID 格式（新上传的文件）
              fileId = mediaUrl;
              // 从 fileID 提取文件名: cloud://env.xxx/ads/filename.ext
              const pathParts = mediaUrl.split("/");
              fileName = pathParts[pathParts.length - 1] || ad._id;
            } else if (mediaUrl.includes("tcb.qcloud.la") && mediaUrl.includes("/ads/")) {
              // CloudBase 临时 URL 格式（旧上传的文件）
              const urlParts = mediaUrl.split("/");
              fileName = urlParts[urlParts.length - 1]?.split("?")[0] || ad._id;

              // 使用广告记录中的文件大小和创建时间
              const fileSize = ad.file_size;
              const lastModified = ad.created_at;

              cloudbaseFiles.push({
                name: fileName,
                url: mediaUrl,
                size: fileSize,
                lastModified: lastModified,
                source: "cloudbase",
                fileId: undefined,
                adId: ad._id || ad.id,
              });
              continue;
            } else {
              // 外部URL（非CloudBase文件），跳过不显示
              console.log("Skipping external URL:", mediaUrl);
              continue;
            }

            if (fileId) {
              fileIdList.push(fileId);
              adMap.set(fileId, { ad, fileName });
            }
          }
        }

        if (fileIdList.length > 0) {
          try {
            const urlResult = await app.getTempFileURL({
              fileList: fileIdList,
            });

            if (urlResult.fileList && Array.isArray(urlResult.fileList)) {
              for (const fileInfo of urlResult.fileList) {
                const mapEntry = adMap.get(fileInfo.fileID);
                if (mapEntry) {
                  const { ad, fileName } = mapEntry;
                  const isSuccess = fileInfo.code === "SUCCESS" && fileInfo.tempFileURL;
                  // 使用兼容的字段名获取原始URL
                  const originalUrl = ad.media_url || ad.file_url || ad.fileUrl;
                  // 如果获取临时URL成功，使用临时URL；否则保存fileID用于后续获取
                  const displayUrl = isSuccess ? fileInfo.tempFileURL : originalUrl;

                  cloudbaseFiles.push({
                    name: fileName,
                    url: displayUrl,
                    size: ad.file_size,
                    lastModified: ad.created_at,
                    source: "cloudbase",
                    fileId: fileInfo.fileID,
                    adId: ad._id || ad.id,
                  });

                  adMap.delete(fileInfo.fileID);
                }
              }
            }

            for (const [fileId, { ad, fileName }] of adMap) {
              const originalUrl = ad.media_url || ad.file_url || ad.fileUrl;
              cloudbaseFiles.push({
                name: fileName,
                url: originalUrl,
                size: ad.file_size,
                lastModified: ad.created_at,
                source: "cloudbase",
                fileId: fileId,
                adId: ad._id || ad.id,
              });
            }
          } catch (urlErr) {
            console.error("CloudBase getTempFileURL error:", urlErr);
            for (const [fileId, { ad, fileName }] of adMap) {
              const originalUrl = ad.media_url || ad.file_url || ad.fileUrl;
              cloudbaseFiles.push({
                name: fileName,
                url: originalUrl,
                size: ad.file_size,
                lastModified: ad.created_at,
                source: "cloudbase",
                fileId: fileId,
                adId: ad._id || ad.id,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("List CloudBase files error:", err);
    }

    return {
      success: true,
      supabaseFiles,
      cloudbaseFiles,
    };
  } catch (err) {
    console.error("List storage files error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取文件列表失败",
    };
  }
}

/**
 * 删除存储文件
 */
export async function deleteStorageFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string,
  adId?: string
): Promise<FileOperationResult> {
  try {
    await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      if (adId) {
        try {
          const db = await getDatabaseAdapter();
          await db.deleteAd(adId);
          console.log("Supabase ad record deleted:", adId);
        } catch (dbErr) {
          console.warn("Supabase delete ad record warning:", dbErr);
        }
      }

      const { error } = await supabaseAdmin.storage
        .from("ads")
        .remove([fileName]);

      if (error) {
        console.error("Supabase delete file error:", error);
        return { success: false, error: "删除文件失败" };
      }
    } else if (source === "cloudbase") {
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        if (adId) {
          try {
            await db.collection("advertisements").doc(adId).remove();
            console.log("CloudBase ad record deleted:", adId);
          } catch (dbErr) {
            console.warn("CloudBase delete ad record warning:", dbErr);
          }
        }

        if (fileId && fileId.startsWith("cloud://")) {
          try {
            await app.deleteFile({ fileList: [fileId] });
            console.log("CloudBase file deleted:", fileId);
          } catch (fileErr) {
            console.warn("CloudBase delete file warning:", fileErr);
          }
        } else {
          console.log("No valid CloudBase fileId provided, skipping file deletion");
        }
      } catch (err) {
        console.error("CloudBase delete error:", err);
        return { success: false, error: "删除 CloudBase 文件失败" };
      }
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (err) {
    console.error("Delete storage file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除文件失败",
    };
  }
}

/**
 * 重命名存储文件（Supabase）
 */
export async function renameStorageFile(
  oldName: string,
  newName: string,
  source: "supabase" | "cloudbase"
): Promise<FileOperationResult> {
  try {
    await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("ads")
        .download(oldName);

      if (downloadError || !fileData) {
        console.error("Supabase download error:", downloadError);
        return { success: false, error: "下载原文件失败" };
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage
        .from("ads")
        .upload(newName, buffer, {
          contentType: fileData.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return { success: false, error: "上传新文件失败" };
      }

      const { error: deleteError } = await supabaseAdmin.storage
        .from("ads")
        .remove([oldName]);

      if (deleteError) {
        console.warn("Supabase delete old file warning:", deleteError);
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("ads")
        .getPublicUrl(newName);

      const oldUrl = supabaseAdmin.storage.from("ads").getPublicUrl(oldName).data.publicUrl;

      await supabaseAdmin
        .from("advertisements")
        .update({ media_url: urlData.publicUrl })
        .eq("media_url", oldUrl);

    } else if (source === "cloudbase") {
      return { success: false, error: "CloudBase 暂不支持重命名文件（需要提供 fileId 和 adId）" };
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (err) {
    console.error("Rename storage file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "重命名文件失败",
    };
  }
}

/**
 * CloudBase 文件重命名（需要 fileId 和 adId）
 */
export async function renameCloudBaseFile(
  oldName: string,
  newName: string,
  fileId: string,
  adId: string
): Promise<FileOperationResult> {
  try {
    await requireAdminSession();

    if (!fileId || !fileId.startsWith("cloud://")) {
      return { success: false, error: "无效的 CloudBase fileId" };
    }

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const db = connector.getClient();
    const app = connector.getApp();

    console.log("CloudBase rename: downloading file", fileId);
    const downloadResult = await app.downloadFile({
      fileID: fileId,
    });

    if (!downloadResult.fileContent) {
      console.error("CloudBase download failed: no fileContent");
      return { success: false, error: "下载原文件失败" };
    }

    const newCloudPath = `ads/${newName}`;
    console.log("CloudBase rename: uploading to", newCloudPath);
    const uploadResult = await app.uploadFile({
      cloudPath: newCloudPath,
      fileContent: downloadResult.fileContent,
    });

    if (!uploadResult.fileID) {
      console.error("CloudBase upload failed: no fileID returned");
      return { success: false, error: "上传新文件失败" };
    }

    console.log("CloudBase rename: new fileID", uploadResult.fileID);

    try {
      await db.collection("advertisements").doc(adId).update({
        media_url: uploadResult.fileID,
      });
      console.log("CloudBase rename: database updated");
    } catch (dbErr) {
      console.error("CloudBase rename: database update failed", dbErr);
      try {
        await app.deleteFile({ fileList: [uploadResult.fileID] });
      } catch {}
      return { success: false, error: "更新数据库记录失败" };
    }

    try {
      await app.deleteFile({ fileList: [fileId] });
      console.log("CloudBase rename: old file deleted");
    } catch (deleteErr) {
      console.warn("CloudBase rename: delete old file warning", deleteErr);
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (err) {
    console.error("CloudBase rename error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "重命名文件失败",
    };
  }
}

/**
 * 下载存储文件
 */
export async function downloadStorageFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string
): Promise<DownloadResult> {
  try {
    await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data, error } = await supabaseAdmin.storage
        .from("ads")
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

      const ext = fileName.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";
      if (ext) {
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          svg: "image/svg+xml",
          mp4: "video/mp4",
          webm: "video/webm",
          mov: "video/quicktime",
          avi: "video/x-msvideo",
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
    console.error("Download storage file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "下载文件失败",
    };
  }
}

/**
 * 获取 CloudBase 文件的临时访问 URL
 * 实时生成新的临时URL，避免过期问题
 */
export async function getCloudBaseFileUrl(fileId: string): Promise<ApiResponse<{ url: string }>> {
  try {
    await requireAdminSession();

    if (!fileId || !fileId.startsWith("cloud://")) {
      return { success: false, error: "无效的fileID格式" };
    }

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const app = connector.getApp();

    const result = await app.getTempFileURL({
      fileList: [fileId],
    });

    if (result.fileList && result.fileList.length > 0) {
      const fileInfo = result.fileList[0];
      if (fileInfo.code === "SUCCESS" && fileInfo.tempFileURL) {
        return {
          success: true,
          data: { url: fileInfo.tempFileURL },
        };
      } else {
        return {
          success: false,
          error: `获取临时URL失败: ${fileInfo.code || "未知错误"}`,
        };
      }
    }

    return { success: false, error: "未返回文件信息" };
  } catch (err) {
    console.error("Get CloudBase file URL error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取文件URL失败",
    };
  }
}
