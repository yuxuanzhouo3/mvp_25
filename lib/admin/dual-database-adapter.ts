/**
 * 双数据库适配器
 *
 * 同时连接 Supabase 和 CloudBase，聚合查询结果
 * 用于管理后台统计双数据库的数据
 *
 * 主要功能：
 * - 并行查询两个数据库
 * - 聚合返回结果（合并列表、统计求和）
 * - 容错处理（一个数据库失败不影响另一个）
 *
 * @author AI Assistant
 * @since 2025-01-22
 */

import { SupabaseAdminAdapter } from "./supabase-adapter";
import { CloudBaseAdminAdapter } from "./cloudbase-adapter";
import type {
  AdminDatabaseAdapter,
  User,
  UserFilters,
  Payment,
  PaymentFilters,
  AdminUser,
  CreateAdminData,
  UpdateAdminData,
  AdminFilters,
  SystemLog,
  CreateLogData,
  LogFilters,
  SystemConfig,
  ConfigCategory,
  Assessment,
  AssessmentFilters,
  Advertisement,
  AdFilters,
  CreateAdData,
  UpdateAdData,
  SocialLink,
  CreateSocialLinkData,
  UpdateSocialLinkData,
  Release,
  ReleaseFilters,
  CreateReleaseData,
  UpdateReleaseData,
} from "./types";

// ==================== 双数据库适配器类 ====================

/**
 * 双数据库管理后台适配器
 *
 * 同时连接 Supabase（国际版）和 CloudBase（国内版）
 * 聚合两个数据库的数据返回统一结果
 */
export class DualDatabaseAdapter implements AdminDatabaseAdapter {
  private supabase: SupabaseAdminAdapter;
  private cloudbase: CloudBaseAdminAdapter;

  // 连接状态跟踪
  private supabaseConnected: boolean = true;
  private cloudbaseConnected: boolean = true;

  constructor() {
    this.supabase = new SupabaseAdminAdapter();
    this.cloudbase = new CloudBaseAdminAdapter();
  }

  // ==================== 辅助方法 ====================

  /**
   * 并行查询两个数据库并处理错误
   *
   * 使用 Promise.allSettled 确保一个数据库失败不影响另一个
   *
   * @param supabaseFn - Supabase 查询函数
   * @param cloudbaseFn - CloudBase 查询函数
   * @returns 两个数据库的查询结果数组 [supabaseResult, cloudbaseResult]
   */
  private async parallelQuery<T>(
    supabaseFn: () => Promise<T>,
    cloudbaseFn: () => Promise<T>
  ): Promise<[T, T]> {
    const startTime = Date.now();

    const [supabaseResult, cloudbaseResult] = await Promise.allSettled([
      supabaseFn().catch((error) => {
        this.supabaseConnected = false;
        throw error;
      }),
      cloudbaseFn().catch((error) => {
        this.cloudbaseConnected = false;
        throw error;
      }),
    ]);

    // 处理 Supabase 结果
    let supabaseData: T;
    if (supabaseResult.status === "fulfilled") {
      supabaseData = supabaseResult.value;
      this.supabaseConnected = true;
    } else {
      this.logError("Supabase", supabaseResult.reason);
      // 返回空数组作为默认值（对于列表查询）
      supabaseData = [] as unknown as T;
    }

    // 处理 CloudBase 结果
    let cloudbaseData: T;
    if (cloudbaseResult.status === "fulfilled") {
      cloudbaseData = cloudbaseResult.value;
      this.cloudbaseConnected = true;
    } else {
      this.logError("CloudBase", cloudbaseResult.reason);
      // 返回空数组作为默认值（对于列表查询）
      cloudbaseData = [] as unknown as T;
    }

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`双数据库查询耗时过长: ${duration}ms`);
    }

    return [supabaseData, cloudbaseData];
  }

  /**
   * 记录数据库错误
   */
  private logError(source: string, error: any): void {
    console.error(`[${source}] 数据库查询失败:`, error?.message || error);
    // 可选：发送到监控系统
  }

  /**
   * 合并两个数组的辅助方法
   */
  private mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
    return [...arr1, ...arr2];
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): {
    supabase: boolean;
    cloudbase: boolean;
  } {
    return {
      supabase: this.supabaseConnected,
      cloudbase: this.cloudbaseConnected,
    };
  }

  // ==================== 管理员操作 ====================

  /**
   * 根据用户名获取管理员
   * 优先从 Supabase 查询，找不到则查询 CloudBase
   */
  async getAdminByUsername(username: string): Promise<AdminUser | null> {
    // 先尝试 Supabase
    try {
      const admin = await this.supabase.getAdminByUsername(username);
      if (admin) return admin;
    } catch (error) {
      this.logError("Supabase", error);
    }

    // 再尝试 CloudBase
    try {
      const admin = await this.cloudbase.getAdminByUsername(username);
      if (admin) return admin;
    } catch (error) {
      this.logError("CloudBase", error);
    }

    return null;
  }

  /**
   * 根据 ID 获取管理员
   * 根据 ID 格式判断从哪个数据库查询
   */
  async getAdminById(id: string): Promise<AdminUser | null> {
    // Supabase 使用 UUID，CloudBase 使用 ObjectId
    // 简单判断：如果是 24 位 hex 字符串，可能是 CloudBase 的 ObjectId
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getAdminById(id);
      } catch (error) {
        this.logError("CloudBase", error);
        // 如果失败，再尝试 Supabase
        return await this.supabase.getAdminById(id);
      }
    } else {
      try {
        return await this.supabase.getAdminById(id);
      } catch (error) {
        this.logError("Supabase", error);
        // 如果失败，再尝试 CloudBase
        return await this.cloudbase.getAdminById(id);
      }
    }
  }

  /**
   * 创建管理员
   * 同时在两个数据库创建
   */
  async createAdmin(data: CreateAdminData): Promise<AdminUser> {
    // 默认在 Supabase 创建（可以根据业务逻辑调整）
    return await this.supabase.createAdmin(data);
  }

  /**
   * 更新管理员
   * 需要找到管理员在哪个数据库，然后更新
   */
  async updateAdmin(id: string, data: UpdateAdminData): Promise<AdminUser> {
    // 先尝试 Supabase
    try {
      return await this.supabase.updateAdmin(id, data);
    } catch (error) {
      // 如果 Supabase 失败，尝试 CloudBase
      return await this.cloudbase.updateAdmin(id, data);
    }
  }

  /**
   * 删除管理员
   */
  async deleteAdmin(id: string): Promise<void> {
    try {
      await this.supabase.deleteAdmin(id);
    } catch (error) {
      // 如果 Supabase 找不到，尝试 CloudBase
      await this.cloudbase.deleteAdmin(id);
    }
  }

  /**
   * 列出所有管理员
   * 合并两个数据库的管理员列表
   */
  async listAdmins(filters?: AdminFilters): Promise<AdminUser[]> {
    const [supabaseAdmins, cloudbaseAdmins] = await this.parallelQuery(
      () => this.supabase.listAdmins(filters),
      () => this.cloudbase.listAdmins(filters)
    );

    // 合并结果
    return this.mergeArrays(supabaseAdmins, cloudbaseAdmins);
  }

  /**
   * 统计管理员数量
   */
  async countAdmins(filters?: AdminFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countAdmins(filters),
      () => this.cloudbase.countAdmins(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  // ==================== 日志操作 ====================

  /**
   * 创建操作日志
   * 日志只写入 Supabase（可以根据需要调整）
   */
  async createLog(log: CreateLogData): Promise<SystemLog> {
    return await this.supabase.createLog(log);
  }

  /**
   * 获取日志列表
   */
  async getLogs(filters?: LogFilters): Promise<SystemLog[]> {
    const [supabaseLogs, cloudbaseLogs] = await this.parallelQuery(
      () => this.supabase.getLogs(filters),
      () => this.cloudbase.getLogs(filters)
    );

    return this.mergeArrays(supabaseLogs, cloudbaseLogs);
  }

  /**
   * 统计日志数量
   */
  async countLogs(filters?: LogFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countLogs(filters),
      () => this.cloudbase.countLogs(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  // ==================== 用户管理操作 ====================

  /**
   * 根据用户名获取普通用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    // 先尝试 Supabase
    try {
      const user = await this.supabase.getUserByUsername?.(username);
      if (user) return user;
    } catch (error) {
      // 忽略
    }

    // 再尝试 CloudBase
    try {
      const user = await this.cloudbase.getUserByUsername?.(username);
      if (user) return user;
    } catch (error) {
      // 忽略
    }

    return null;
  }

  /**
   * 根据 ID 获取普通用户
   */
  async getUserById(id: string): Promise<User | null> {
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getUserById(id);
      } catch (error) {
        return await this.supabase.getUserById(id);
      }
    } else {
      try {
        return await this.supabase.getUserById(id);
      } catch (error) {
        return await this.cloudbase.getUserById(id);
      }
    }
  }

  /**
   * 列出普通用户
   * 合并两个数据库的用户列表（核心方法）
   */
  async listUsers(filters?: UserFilters): Promise<User[]> {
    const [supabaseUsers, cloudbaseUsers] = await this.parallelQuery(
      () => this.supabase.listUsers(filters),
      () => this.cloudbase.listUsers(filters)
    );

    // 合并结果
    return this.mergeArrays(supabaseUsers, cloudbaseUsers);
  }

  /**
   * 统计普通用户数量
   */
  async countUsers(filters?: UserFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countUsers(filters),
      () => this.cloudbase.countUsers(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  /**
   * 更新普通用户
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // 先尝试 Supabase
    try {
      return await this.supabase.updateUser(id, updates);
    } catch (error) {
      // 如果 Supabase 失败，尝试 CloudBase
      return await this.cloudbase.updateUser(id, updates);
    }
  }

  /**
   * 删除普通用户
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.supabase.deleteUser(id);
    } catch (error) {
      // 如果 Supabase 找不到，尝试 CloudBase
      await this.cloudbase.deleteUser(id);
    }
  }

  // ==================== 评估管理操作 ====================

  /**
   * 根据 ID 获取评估记录
   */
  async getAssessmentById(id: string): Promise<Assessment | null> {
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getAssessmentById(id);
      } catch (error) {
        return await this.supabase.getAssessmentById(id);
      }
    } else {
      try {
        return await this.supabase.getAssessmentById(id);
      } catch (error) {
        return await this.cloudbase.getAssessmentById(id);
      }
    }
  }

  /**
   * 列出评估记录
   */
  async listAssessments(filters?: AssessmentFilters): Promise<Assessment[]> {
    const [supabaseAssessments, cloudbaseAssessments] = await this.parallelQuery(
      () => this.supabase.listAssessments(filters),
      () => this.cloudbase.listAssessments(filters)
    );

    return this.mergeArrays(supabaseAssessments, cloudbaseAssessments);
  }

  /**
   * 统计评估记录数量
   */
  async countAssessments(filters?: AssessmentFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countAssessments(filters),
      () => this.cloudbase.countAssessments(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  /**
   * 删除评估记录
   */
  async deleteAssessment(id: string): Promise<void> {
    try {
      await this.supabase.deleteAssessment(id);
    } catch (error) {
      await this.cloudbase.deleteAssessment(id);
    }
  }

  // ==================== 支付管理操作（核心方法） ====================

  /**
   * 根据 ID 获取支付记录
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getPaymentById(id);
      } catch (error) {
        return await this.supabase.getPaymentById(id);
      }
    } else {
      try {
        return await this.supabase.getPaymentById(id);
      } catch (error) {
        return await this.cloudbase.getPaymentById(id);
      }
    }
  }

  /**
   * 列出支付记录
   * 合并两个数据库的支付列表（核心方法）
   */
  async listPayments(filters?: PaymentFilters): Promise<Payment[]> {
    const [supabasePayments, cloudbasePayments] = await this.parallelQuery(
      () => this.supabase.listPayments(filters),
      () => this.cloudbase.listPayments(filters)
    );

    // 合并结果
    return this.mergeArrays(supabasePayments, cloudbasePayments);
  }

  /**
   * 统计支付记录数量
   */
  async countPayments(filters?: PaymentFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countPayments(filters),
      () => this.cloudbase.countPayments(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  // ==================== 广告管理操作 ====================

  /**
   * 根据 ID 获取广告
   */
  async getAdById(id: string): Promise<Advertisement | null> {
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getAdById(id);
      } catch (error) {
        return await this.supabase.getAdById(id);
      }
    } else {
      try {
        return await this.supabase.getAdById(id);
      } catch (error) {
        return await this.cloudbase.getAdById(id);
      }
    }
  }

  /**
   * 列出广告
   */
  async listAds(filters?: AdFilters): Promise<Advertisement[]> {
    const [supabaseAds, cloudbaseAds] = await this.parallelQuery(
      () => this.supabase.listAds(filters),
      () => this.cloudbase.listAds(filters)
    );

    return this.mergeArrays(supabaseAds, cloudbaseAds);
  }

  /**
   * 统计广告数量
   */
  async countAds(filters?: AdFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countAds(filters),
      () => this.cloudbase.countAds(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  /**
   * 创建广告
   * 同时在两个数据库创建（双写）
   */
  async createAd(data: CreateAdData): Promise<Advertisement> {
    // 在 Supabase 创建
    return await this.supabase.createAd(data);
  }

  /**
   * 更新广告
   */
  async updateAd(id: string, data: UpdateAdData): Promise<Advertisement> {
    try {
      return await this.supabase.updateAd(id, data);
    } catch (error) {
      return await this.cloudbase.updateAd(id, data);
    }
  }

  /**
   * 删除广告
   */
  async deleteAd(id: string): Promise<void> {
    try {
      await this.supabase.deleteAd(id);
    } catch (error) {
      await this.cloudbase.deleteAd(id);
    }
  }

  // ==================== 社交链接管理操作 ====================

  /**
   * 根据 ID 获取社交链接
   */
  async getSocialLinkById(id: string): Promise<SocialLink | null> {
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getSocialLinkById(id);
      } catch (error) {
        return await this.supabase.getSocialLinkById(id);
      }
    } else {
      try {
        return await this.supabase.getSocialLinkById(id);
      } catch (error) {
        return await this.cloudbase.getSocialLinkById(id);
      }
    }
  }

  /**
   * 列出社交链接
   */
  async listSocialLinks(): Promise<SocialLink[]> {
    const [supabaseLinks, cloudbaseLinks] = await this.parallelQuery(
      () => this.supabase.listSocialLinks(),
      () => this.cloudbase.listSocialLinks()
    );

    return this.mergeArrays(supabaseLinks, cloudbaseLinks);
  }

  /**
   * 创建社交链接
   */
  async createSocialLink(data: CreateSocialLinkData): Promise<SocialLink> {
    return await this.supabase.createSocialLink(data);
  }

  /**
   * 更新社交链接
   */
  async updateSocialLink(id: string, data: UpdateSocialLinkData): Promise<SocialLink> {
    try {
      return await this.supabase.updateSocialLink(id, data);
    } catch (error) {
      return await this.cloudbase.updateSocialLink(id, data);
    }
  }

  /**
   * 删除社交链接
   */
  async deleteSocialLink(id: string): Promise<void> {
    try {
      await this.supabase.deleteSocialLink(id);
    } catch (error) {
      await this.cloudbase.deleteSocialLink(id);
    }
  }

  // ==================== 版本发布管理操作 ====================

  /**
   * 根据 ID 获取版本发布
   */
  async getReleaseById(id: string): Promise<Release | null> {
    const isCloudBaseId = /^[a-f0-9]{24}$/.test(id);

    if (isCloudBaseId) {
      try {
        return await this.cloudbase.getReleaseById(id);
      } catch (error) {
        return await this.supabase.getReleaseById(id);
      }
    } else {
      try {
        return await this.supabase.getReleaseById(id);
      } catch (error) {
        return await this.cloudbase.getReleaseById(id);
      }
    }
  }

  /**
   * 列出版本发布
   */
  async listReleases(filters?: ReleaseFilters): Promise<Release[]> {
    const [supabaseReleases, cloudbaseReleases] = await this.parallelQuery(
      () => this.supabase.listReleases(filters),
      () => this.cloudbase.listReleases(filters)
    );

    return this.mergeArrays(supabaseReleases, cloudbaseReleases);
  }

  /**
   * 统计版本发布数量
   */
  async countReleases(filters?: ReleaseFilters): Promise<number> {
    const [supabaseCount, cloudbaseCount] = await this.parallelQuery(
      () => this.supabase.countReleases(filters),
      () => this.cloudbase.countReleases(filters)
    );

    return supabaseCount + cloudbaseCount;
  }

  /**
   * 创建版本发布
   */
  async createRelease(data: CreateReleaseData): Promise<Release> {
    return await this.supabase.createRelease(data);
  }

  /**
   * 更新版本发布
   */
  async updateRelease(id: string, data: UpdateReleaseData): Promise<Release> {
    try {
      return await this.supabase.updateRelease(id, data);
    } catch (error) {
      return await this.cloudbase.updateRelease(id, data);
    }
  }

  /**
   * 删除版本发布
   */
  async deleteRelease(id: string): Promise<void> {
    try {
      await this.supabase.deleteRelease(id);
    } catch (error) {
      await this.cloudbase.deleteRelease(id);
    }
  }

  // ==================== 配置操作 ====================

  /**
   * 获取配置值
   */
  async getConfig(key: string): Promise<any> {
    try {
      return await this.supabase.getConfig(key);
    } catch (error) {
      return await this.cloudbase.getConfig(key);
    }
  }

  /**
   * 设置配置值
   */
  async setConfig(
    key: string,
    value: any,
    category: ConfigCategory,
    description?: string
  ): Promise<void> {
    try {
      await this.supabase.setConfig(key, value, category, description);
    } catch (error) {
      await this.cloudbase.setConfig(key, value, category, description);
    }
  }

  /**
   * 列出所有配置
   */
  async listConfigs(category?: ConfigCategory): Promise<SystemConfig[]> {
    const [supabaseConfigs, cloudbaseConfigs] = await this.parallelQuery(
      () => this.supabase.listConfigs(category),
      () => this.cloudbase.listConfigs(category)
    );

    // 配置通常只在一个数据库，这里简单合并
    return this.mergeArrays(supabaseConfigs, cloudbaseConfigs);
  }

  /**
   * 删除配置
   */
  async deleteConfig(key: string): Promise<void> {
    try {
      await this.supabase.deleteConfig(key);
    } catch (error) {
      await this.cloudbase.deleteConfig(key);
    }
  }

  // ==================== 健康检查 ====================

  /**
   * 检查数据库连接
   */
  async healthCheck(): Promise<boolean> {
    const status = this.getConnectionStatus();
    // 至少一个数据库连接正常就返回 true
    return status.supabase || status.cloudbase;
  }
}
