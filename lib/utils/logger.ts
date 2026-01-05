// 统一的日志系统 - 兼容 Edge Runtime

class UniversalLogger {
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message: any, meta?: any) {
    if (typeof message === "object" && meta) {
      console.error(this.formatMessage("error", meta, message));
    } else if (typeof message === "object") {
      console.error(this.formatMessage("error", JSON.stringify(message), undefined));
    } else {
      console.error(this.formatMessage("error", message, meta));
    }
  }

  warn(message: any, meta?: any) {
    if (typeof message === "object" && meta) {
      console.warn(this.formatMessage("warn", meta, message));
    } else if (typeof message === "object") {
      console.warn(this.formatMessage("warn", JSON.stringify(message), undefined));
    } else {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  info(message: any, meta?: any) {
    if (typeof message === "object" && meta) {
      console.info(this.formatMessage("info", meta, message));
    } else if (typeof message === "object") {
      console.info(this.formatMessage("info", JSON.stringify(message), undefined));
    } else {
      console.info(this.formatMessage("info", message, meta));
    }
  }

  debug(message: any, meta?: any) {
    if (typeof message === "object" && meta) {
      console.debug(this.formatMessage("debug", meta, message));
    } else if (typeof message === "object") {
      console.debug(this.formatMessage("debug", JSON.stringify(message), undefined));
    } else {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new UniversalLogger();

export const logError = (message: string, error?: Error, meta?: any) => {
  if (error instanceof Error) {
    logger.error({ err: error, ...meta }, message);
  } else {
    logger.error(message, meta);
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn({ ...meta }, message);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info({ ...meta }, message);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug({ ...meta }, message);
};

// 安全事件日志
export const logSecurityEvent = (
  event: string,
  userId?: string,
  ip?: string,
  meta?: any
) => {
  logger.warn(
    {
      type: "security",
      event,
      userId,
      ip,
      timestamp: new Date().toISOString(),
      ...meta,
    },
    `Security Event: ${event}`
  );
};

// 业务事件日志
export const logBusinessEvent = (
  event: string,
  userId?: string,
  meta?: any
) => {
  logger.info(
    {
      type: "business",
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
    `Business Event: ${event}`
  );
};
