/**
 * Centralized Logging System with Correlation IDs
 * Provides structured logging for debugging distributed issues
 */

// Log levels in order of severity
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

// Default configuration
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableConsole: true,
  enableStructured: true,
  includeTimestamp: true,
  includeTraceId: true,
  includeRequestId: true,
  redactSensitiveData: true,
  sensitiveFields: [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "session",
    "credit_card",
    "ssn",
    "api_key",
  ],
};

/**
 * Logger class for structured logging
 */
class Logger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.context = new Map(); // Request-scoped context
  }

  /**
   * Set context for the current request
   */
  setContext(context) {
    if (context?.traceId) {
      this.context.set("traceId", context.traceId);
    }
    if (context?.requestId) {
      this.context.set("requestId", context.requestId);
    }
    if (context?.userId) {
      this.context.set("userId", context.userId);
    }
    if (context?.action) {
      this.context.set("action", context.action);
    }
  }

  /**
   * Clear request context
   */
  clearContext() {
    this.context.clear();
  }

  /**
   * Get current context
   */
  getContext() {
    return Object.fromEntries(this.context);
  }

  /**
   * Redact sensitive data from objects
   */
  redactSensitiveData(data) {
    if (!this.config.redactSensitiveData || !data || typeof data !== "object") {
      return data;
    }

    const redacted = { ...data };
    const sensitivePattern = new RegExp(this.config.sensitiveFields.join("|"), "i");

    const redactValue = (obj, path = "") => {
      if (Array.isArray(obj)) {
        return obj.map((item, index) => redactValue(item, `${path}[${index}]`));
      }

      if (obj && typeof obj === "object") {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (sensitivePattern.test(key)) {
            result[key] = "[REDACTED]";
          } else if (typeof value === "object" && value !== null) {
            result[key] = redactValue(value, currentPath);
          } else {
            result[key] = value;
          }
        }
        return result;
      }

      return obj;
    };

    return redactValue(redacted);
  }

  /**
   * Create log entry
   */
  createLogEntry(level, message, data = null, error = null) {
    const entry = {
      level: this.getLevelName(level),
      message,
    };

    // Add timestamp if enabled
    if (this.config.includeTimestamp) {
      entry.timestamp = new Date().toISOString();
    }

    // Add context if enabled
    if (this.config.includeTraceId && this.context.has("traceId")) {
      entry.traceId = this.context.get("traceId");
    }
    if (this.config.includeRequestId && this.context.has("requestId")) {
      entry.requestId = this.context.get("requestId");
    }

    // Add additional context
    const context = this.getContext();
    if (Object.keys(context).length > 0) {
      entry.context = context;
    }

    // Add data if provided
    if (data) {
      entry.data = this.redactSensitiveData(data);
    }

    // Add error details if provided
    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    return entry;
  }

  /**
   * Get level name from number
   */
  getLevelName(level) {
    return Object.keys(LOG_LEVELS).find((key) => LOG_LEVELS[key] === level) || "UNKNOWN";
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return level <= this.config.level;
  }

  /**
   * Log to console
   */
  logToConsole(entry) {
    if (!this.config.enableConsole) return;

    const { level, message, timestamp, traceId, requestId, data, error } = entry;
    const contextStr = traceId ? ` [${traceId}${requestId ? `:${requestId}` : ""}]` : "";
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    const errorStr = error ? ` ${error.message}` : "";

    const logMessage = `${timestamp || ""}${contextStr} ${level}: ${message}${dataStr}${errorStr}`;

    switch (entry.level) {
      case "ERROR":
        console.error(logMessage);
        break;
      case "WARN":
        console.warn(logMessage);
        break;
      case "INFO":
        console.info(logMessage);
        break;
      case "DEBUG":
        console.debug(logMessage);
        break;
      case "TRACE":
        console.trace(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Log structured data
   */
  logStructured(entry) {
    if (!this.config.enableStructured) return;

    // In production, this could send to a logging service
    // For now, we'll just log to console with JSON format
    console.log(JSON.stringify(entry));
  }

  /**
   * Generic log method
   */
  log(level, message, data = null, error = null) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data, error);

    this.logToConsole(entry);
    this.logStructured(entry);

    return entry;
  }

  // Convenience methods
  error(message, data = null, error = null) {
    return this.log(LOG_LEVELS.ERROR, message, data, error);
  }

  warn(message, data = null, error = null) {
    return this.log(LOG_LEVELS.WARN, message, data, error);
  }

  info(message, data = null) {
    return this.log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = null) {
    return this.log(LOG_LEVELS.DEBUG, message, data);
  }

  trace(message, data = null) {
    return this.log(LOG_LEVELS.TRACE, message, data);
  }

  /**
   * Performance logging
   */
  startTimer(name) {
    const startTime = performance.now();
    return {
      name,
      startTime,
      end: (additionalData = {}) => {
        const duration = performance.now() - startTime;
        return this.info(`Timer: ${name}`, {
          duration: Math.round(duration * 100) / 100,
          unit: "ms",
          ...additionalData,
        });
      },
    };
  }

  /**
   * API request logging
   */
  logRequest(request, responseTime = null, error = null) {
    const data = {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for"),
    };

    if (responseTime !== null) {
      data.responseTime = responseTime;
    }

    if (error) {
      this.error(`API Request Failed: ${request.method} ${request.url}`, data, error);
    } else {
      this.info(`API Request: ${request.method} ${request.url}`, data);
    }
  }

  /**
   * Database operation logging
   */
  logDatabase(operation, table, duration = null, error = null) {
    const data = {
      operation,
      table,
      duration,
    };

    if (error) {
      this.error(`Database Operation Failed: ${operation} on ${table}`, data, error);
    } else {
      this.debug(`Database Operation: ${operation} on ${table}`, data);
    }
  }

  /**
   * Security event logging
   */
  logSecurity(event, details = {}) {
    this.warn(`Security Event: ${event}`, {
      category: "security",
      ...details,
    });
  }

  // Back-compat alias used by other modules.
  security(event, details = {}) {
    return this.logSecurity(event, details);
  }
}

// Global logger instance
let globalLogger = null;

/**
 * Initialize global logger
 */
export function initializeLogger(config = {}) {
  globalLogger = new Logger(config);
  return globalLogger;
}

/**
 * Get global logger instance
 */
export function getLogger() {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

/**
 * Middleware for request context
 */
export function loggingMiddleware(request) {
  const traceId = request.headers.get("x-trace-id") || crypto.randomUUID();
  const requestId = crypto.randomUUID();

  const logger = getLogger();
  logger.setContext({ traceId, requestId });

  return {
    traceId,
    requestId,
    logger,
  };
}

/**
 * Decorator for automatic function logging
 */
export function logFunction(options = {}) {
  const { level = "debug", includeArgs = false, includeResult = false, logErrors = true } = options;

  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const logger = getLogger();

    descriptor.value = async function (...args) {
      const functionName = `${target.constructor.name}.${propertyKey}`;
      const timer = logger.startTimer(functionName);

      const logData = {
        function: functionName,
      };

      if (includeArgs) {
        logData.args = args;
      }

      try {
        const result = await originalMethod.apply(this, args);

        if (includeResult) {
          logData.result = typeof result === "object" ? result : { value: result };
        }

        timer.end(logData);
        return result;
      } catch (error) {
        if (logErrors) {
          logger.error(`Function Error: ${functionName}`, logData, error);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

export { Logger, LOG_LEVELS };
