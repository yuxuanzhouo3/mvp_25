import { logSecurityEvent } from "../utils/logger";

// 账户锁定配置
export interface AccountLockoutPolicy {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  resetAfterMinutes: number;
  progressiveLockout: boolean;
}

export const DEFAULT_LOCKOUT_POLICY: AccountLockoutPolicy = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  resetAfterMinutes: 30,
  progressiveLockout: true,
};

interface LockoutRecord {
  failedAttempts: number;
  lastFailedAttempt: Date;
  lockoutUntil?: Date;
  progressiveLevel: number;
}

/**
 * 账户锁定管理器
 */
export class AccountLockoutManager {
  private static instance: AccountLockoutManager;
  private policy: AccountLockoutPolicy;
  private lockoutRecords: Map<string, LockoutRecord> = new Map();

  private constructor(policy: AccountLockoutPolicy = DEFAULT_LOCKOUT_POLICY) {
    this.policy = policy;
  }

  static getInstance(policy?: AccountLockoutPolicy): AccountLockoutManager {
    if (!AccountLockoutManager.instance) {
      AccountLockoutManager.instance = new AccountLockoutManager(policy);
    }
    return AccountLockoutManager.instance;
  }

  /**
   * 记录登录失败
   */
  recordFailedAttempt(
    identifier: string,
    ip?: string
  ): {
    isLocked: boolean;
    remainingAttempts: number;
    lockoutUntil?: Date;
  } {
    const now = new Date();
    const record = this.lockoutRecords.get(identifier) || {
      failedAttempts: 0,
      lastFailedAttempt: now,
      progressiveLevel: 0,
    };

    const timeSinceLastAttempt =
      now.getTime() - record.lastFailedAttempt.getTime();
    const resetThreshold = this.policy.resetAfterMinutes * 60 * 1000;

    if (timeSinceLastAttempt > resetThreshold) {
      record.failedAttempts = 0;
      record.progressiveLevel = 0;
    }

    record.failedAttempts++;
    record.lastFailedAttempt = now;

    let lockoutDuration = this.policy.lockoutDurationMinutes;

    if (this.policy.progressiveLockout) {
      record.progressiveLevel++;
      lockoutDuration = Math.min(
        this.policy.lockoutDurationMinutes *
        Math.pow(2, record.progressiveLevel - 1),
        24 * 60
      );
    }

    if (record.failedAttempts >= this.policy.maxFailedAttempts) {
      record.lockoutUntil = new Date(
        now.getTime() + lockoutDuration * 60 * 1000
      );

      logSecurityEvent("account_locked", undefined, ip, {
        identifier: this.maskIdentifier(identifier),
        failedAttempts: record.failedAttempts,
        lockoutDuration,
        progressiveLevel: record.progressiveLevel,
      });
    }

    this.lockoutRecords.set(identifier, record);

    const isLocked = record.lockoutUntil ? record.lockoutUntil > now : false;
    const remainingAttempts = Math.max(
      0,
      this.policy.maxFailedAttempts - record.failedAttempts
    );

    return {
      isLocked,
      remainingAttempts,
      lockoutUntil: record.lockoutUntil,
    };
  }

  /**
   * 记录登录成功
   */
  recordSuccessfulLogin(identifier: string): void {
    const record = this.lockoutRecords.get(identifier);
    if (record) {
      record.failedAttempts = 0;
      record.progressiveLevel = 0;
      delete record.lockoutUntil;
    }
  }

  /**
   * 检查账户是否被锁定
   */
  isLocked(identifier: string): {
    locked: boolean;
    lockoutUntil?: Date;
    remainingTimeMinutes?: number;
  } {
    const record = this.lockoutRecords.get(identifier);
    if (!record || !record.lockoutUntil) {
      return { locked: false };
    }

    const now = new Date();
    if (record.lockoutUntil > now) {
      const remainingTimeMinutes = Math.ceil(
        (record.lockoutUntil.getTime() - now.getTime()) / (1000 * 60)
      );
      return {
        locked: true,
        lockoutUntil: record.lockoutUntil,
        remainingTimeMinutes,
      };
    } else {
      record.failedAttempts = 0;
      record.progressiveLevel = 0;
      delete record.lockoutUntil;
      return { locked: false };
    }
  }

  /**
   * 手动解锁账户
   */
  unlockAccount(identifier: string): boolean {
    const record = this.lockoutRecords.get(identifier);
    if (record) {
      record.failedAttempts = 0;
      record.progressiveLevel = 0;
      delete record.lockoutUntil;
      return true;
    }
    return false;
  }

  private maskIdentifier(identifier: string): string {
    if (identifier.includes("@")) {
      const [local, domain] = identifier.split("@");
      if (local.length > 2) {
        return `${local.substring(0, 2)}***@${domain}`;
      }
    }
    if (identifier.length > 4) {
      return `${identifier.substring(0, 2)}***${identifier.substring(
        identifier.length - 2
      )}`;
    }
    return "***";
  }
}

export const accountLockout = AccountLockoutManager.getInstance();
