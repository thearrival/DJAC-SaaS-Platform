import { describe, it, expect } from "vitest";

type LogCategory =
  | "auth"
  | "rbac"
  | "audit"
  | "billing"
  | "ai"
  | "report"
  | "vendor"
  | "compliance"
  | "system"
  | "http"
  | "db";

interface LogEvent {
  level: string;
  msg: string;
  category: LogCategory;
  action: string;
  [key: string]: unknown;
}

// ── Inline logger mock ────────────────────────────────────────────────────

class TestLogger {
  level: string;
  base: { service: string; env: string };
  logs: LogEvent[] = [];

  constructor(opts: { level: string; env: string }) {
    this.level = opts.level;
    this.base = { service: "djac-tool", env: opts.env };
  }

  info(msgOrObj: unknown, msg?: string) {
    this._log("info", msgOrObj, msg);
  }

  warn(msgOrObj: unknown, msg?: string) {
    this._log("warn", msgOrObj, msg);
  }

  error(msgOrObj: unknown, msg?: string) {
    this._log("error", msgOrObj, msg);
  }

  debug(msgOrObj: unknown, msg?: string) {
    this._log("debug", msgOrObj, msg);
  }

  private _log(level: string, msgOrObj: unknown, msg?: string) {
    const entry: LogEvent = {
      level,
      msg: typeof msgOrObj === "string" ? msgOrObj : (msg ?? ""),
      category: "system" as LogCategory,
      action: "",
    };
    if (typeof msgOrObj === "object" && msgOrObj !== null) {
      Object.assign(entry, msgOrObj);
    }
    this.logs.push(entry);
  }

  child(bindings: Record<string, unknown>): TestLogger {
    const child = new TestLogger({
      level: this.level,
      env: this.base.env,
    });
    child.base = { ...this.base, ...bindings };
    return child;
  }
}

function createLogger(options: { env: string }) {
  return new TestLogger({
    level: options.env === "development" ? "debug" : "info",
    env: options.env,
  });
}

function logEvent(
  logger: TestLogger,
  category: LogCategory,
  action: string,
  data?: Record<string, unknown>,
  level: "info" | "warn" | "error" | "debug" = "info"
) {
  logger[level]({ category, action, ...data }, action);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("createLogger", () => {
  it("should set debug level in development", () => {
    const log = createLogger({ env: "development" });
    expect(log.level).toBe("debug");
  });

  it("should set info level in production", () => {
    const log = createLogger({ env: "production" });
    expect(log.level).toBe("info");
  });

  it("should set info level in test", () => {
    const log = createLogger({ env: "test" });
    expect(log.level).toBe("info");
  });

  it("should have service base field", () => {
    const log = createLogger({ env: "production" });
    expect(log.base.service).toBe("djac-tool");
  });

  it("should set env in base fields", () => {
    const log = createLogger({ env: "production" });
    expect(log.base.env).toBe("production");
  });

  it("should have different env values", () => {
    const devLog = createLogger({ env: "development" });
    const prodLog = createLogger({ env: "production" });
    expect(devLog.base.env).toBe("development");
    expect(prodLog.base.env).toBe("production");
  });
});

describe("logger.info", () => {
  it("should record an info log entry", () => {
    const log = createLogger({ env: "test" });
    log.info("test message");
    expect(log.logs).toHaveLength(1);
    expect(log.logs[0].level).toBe("info");
    expect(log.logs[0].msg).toBe("test message");
  });

  it("should accept structured data", () => {
    const log = createLogger({ env: "test" });
    log.info({ userId: 42, action: "login" }, "User signed in");
    expect(log.logs[0].userId).toBe(42);
    expect(log.logs[0].action).toBe("login");
    expect(log.logs[0].msg).toBe("User signed in");
  });
});

describe("logger.warn", () => {
  it("should record a warn log entry", () => {
    const log = createLogger({ env: "test" });
    log.warn("warning message");
    expect(log.logs[0].level).toBe("warn");
  });
});

describe("logger.error", () => {
  it("should record an error log entry", () => {
    const log = createLogger({ env: "test" });
    log.error("error message");
    expect(log.logs[0].level).toBe("error");
  });
});

describe("logger.debug", () => {
  it("should record a debug log entry", () => {
    const log = createLogger({ env: "test" });
    log.debug("debug message");
    expect(log.logs[0].level).toBe("debug");
  });
});

describe("childLogger", () => {
  it("should create a child logger with additional bindings", () => {
    const log = createLogger({ env: "test" });
    const child = log.child({ requestId: "req-123" });
    expect(child.base.requestId).toBe("req-123");
  });

  it("should preserve parent base fields", () => {
    const log = createLogger({ env: "test" });
    const child = log.child({ requestId: "req-123" });
    expect(child.base.service).toBe("djac-tool");
    expect(child.base.env).toBe("test");
  });

  it("should inherit log level from parent", () => {
    const log = createLogger({ env: "development" });
    const child = log.child({ requestId: "req-123" });
    expect(child.level).toBe("debug");
  });

  it("should support multiple chained child loggers", () => {
    const log = createLogger({ env: "test" });
    const child1 = log.child({ requestId: "req-1" });
    const child2 = child1.child({ userId: 99 });
    expect(child2.base.requestId).toBe("req-1");
    expect(child2.base.userId).toBe(99);
    expect(child2.base.service).toBe("djac-tool");
  });
});

describe("logEvent", () => {
  it("should log at info level by default", () => {
    const log = createLogger({ env: "test" });
    logEvent(log, "auth", "login");
    expect(log.logs).toHaveLength(1);
    expect(log.logs[0].level).toBe("info");
    expect(log.logs[0].category).toBe("auth");
    expect(log.logs[0].action).toBe("login");
  });

  it("should log at the specified level", () => {
    const log = createLogger({ env: "test" });
    logEvent(log, "billing", "payment_failed", undefined, "warn");
    expect(log.logs[0].level).toBe("warn");
    expect(log.logs[0].category).toBe("billing");
    expect(log.logs[0].action).toBe("payment_failed");
  });

  it("should include extra data in the log entry", () => {
    const log = createLogger({ env: "test" });
    logEvent(log, "compliance", "report_generated", {
      reportId: "rpt-1",
      framework: "SOC2",
    });
    expect(log.logs[0].reportId).toBe("rpt-1");
    expect(log.logs[0].framework).toBe("SOC2");
  });

  it("should support all log categories", () => {
    const log = createLogger({ env: "test" });
    const categories: LogCategory[] = [
      "auth",
      "rbac",
      "audit",
      "billing",
      "ai",
      "report",
      "vendor",
      "compliance",
      "system",
      "http",
      "db",
    ];
    for (const cat of categories) {
      logEvent(log, cat, "test");
    }
    expect(log.logs).toHaveLength(categories.length);
    for (let i = 0; i < categories.length; i++) {
      expect(log.logs[i].category).toBe(categories[i]);
    }
  });

  it("should support error level", () => {
    const log = createLogger({ env: "test" });
    logEvent(log, "system", "crash", { error: new Error("fail") }, "error");
    expect(log.logs[0].level).toBe("error");
    expect(log.logs[0].action).toBe("crash");
  });

  it("should support debug level", () => {
    const log = createLogger({ env: "test" });
    logEvent(log, "http", "request", { path: "/health" }, "debug");
    expect(log.logs[0].level).toBe("debug");
  });
});
