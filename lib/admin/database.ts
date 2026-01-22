/**
 * 数据库适配器接口定义
 *
 * 定义统一的数据访问层，支持多种数据库实现
 * 实现数据库无关的业务逻辑，便于测试和切换数据库
 */

import type {
  AdminUser,
  CreateAdminData,
  UpdateAdminData,
  AdminFilters,
  SystemLog,
  CreateLogData,
  LogFilters,
  SystemConfig,
  ConfigCategory,
  AdminDatabaseAdapter,
} from "./types";

// ==================== 数据库适配器工厂 ====================

/**
 * 获取数据库适配器实例
 *
 * 返回双数据库适配器，同时连接 Supabase 和 CloudBase
 * 使用单例模式避免重复初始化
 *
 * @returns 数据库适配器实例
 */
let adapterInstance: AdminDatabaseAdapter | null = null;

export async function getDatabaseAdapter(): Promise<AdminDatabaseAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  // 使用双数据库适配器，同时查询 Supabase 和 CloudBase
  const { DualDatabaseAdapter } = await import("./dual-database-adapter");
  adapterInstance = new DualDatabaseAdapter();

  return adapterInstance;
}

/**
 * 重置适配器实例
 * 用于测试或环境切换
 */
export function resetDatabaseAdapter(): void {
  adapterInstance = null;
}

// ==================== 通用错误处理 ====================

/**
 * 数据库错误类
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * 处理数据库错误
 * 统一的错误处理逻辑
 */
export function handleDatabaseError(error: any): never {
  console.error("数据库操作失败:", error);

  // 根据错误类型返回友好的错误信息
  if (error.code === "DUPLICATE_KEY") {
    throw new DatabaseError("数据已存在", "DUPLICATE_KEY", error);
  }

  if (error.code === "NOT_FOUND") {
    throw new DatabaseError("数据不存在", "NOT_FOUND", error);
  }

  if (error.code === "INVALID_INPUT") {
    throw new DatabaseError("输入数据无效", "INVALID_INPUT", error);
  }

  // 默认错误
  throw new DatabaseError(
    "数据库操作失败，请稍后重试",
    "DATABASE_ERROR",
    error
  );
}

// ==================== 类型转换工具 ====================

/**
 * 转换日期为 ISO 字符串
 */
export function toISOString(date: Date | string | number): string {
  if (typeof date === "string") {
    return date;
  }
  if (typeof date === "number") {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * 转换数据库字段名
 * 将数据库的 snake_case 转换为 camelCase
 */
export function snakeToCamel<T = any>(obj: any): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as any;
  }

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      result[camelKey] = snakeToCamel(obj[key]);
    }
  }
  return result;
}

/**
 * 转换为数据库字段名
 * 将 camelCase 转换为 snake_case
 */
export function camelToSnake(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      result[snakeKey] = camelToSnake(obj[key]);
    }
  }
  return result;
}
