import { describe, it, expect, beforeEach } from "vitest";

// ── Sentry stub ───────────────────────────────────────────────────────────

const sentryState: {
  initializedDsn: string | null;
  environment: string | null;
  tracesSampleRate: number | null;
  includeLocalVariables: boolean | null;
} = {
  initializedDsn: null,
  environment: null,
  tracesSampleRate: null,
  includeLocalVariables: null,
};

function resetSentryState() {
  sentryState.initializedDsn = null;
  sentryState.environment = null;
  sentryState.tracesSampleRate = null;
  sentryState.includeLocalVariables = null;
}

function sentryInit(opts: {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  includeLocalVariables: boolean;
}) {
  sentryState.initializedDsn = opts.dsn;
  sentryState.environment = opts.environment;
  sentryState.tracesSampleRate = opts.tracesSampleRate;
  sentryState.includeLocalVariables = opts.includeLocalVariables;
}

function sentryExpressErrorHandler() {
  return (
    err: Error,
    _req: unknown,
    res: { status: (code: number) => { json: (body: unknown) => void } },
    _next: unknown
  ): void => {
    res.status(500).json({ error: "Internal Server Error" });
  };
}

function initialiseSentry(opts: {
  dsn: string | undefined;
  isProduction: boolean;
  nodeEnv: string;
}) {
  if (!opts.dsn) return false;

  sentryInit({
    dsn: opts.dsn,
    environment: opts.nodeEnv ?? "production",
    tracesSampleRate: opts.isProduction ? 0.1 : 1.0,
    includeLocalVariables: !opts.isProduction,
  });

  return true;
}

function sentryErrorHandler() {
  return sentryExpressErrorHandler();
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("initialiseSentry", () => {
  beforeEach(() => {
    resetSentryState();
  });

  it("should not initialise when DSN is undefined", () => {
    const result = initialiseSentry({
      dsn: undefined,
      isProduction: false,
      nodeEnv: "development",
    });
    expect(result).toBe(false);
    expect(sentryState.initializedDsn).toBeNull();
  });

  it("should not initialise when DSN is empty string", () => {
    const result = initialiseSentry({
      dsn: "",
      isProduction: false,
      nodeEnv: "development",
    });
    expect(result).toBe(false);
    expect(sentryState.initializedDsn).toBeNull();
  });

  it("should initialise with provided DSN", () => {
    const result = initialiseSentry({
      dsn: "https://sentry-dsn@test.ingest.sentry.io/123",
      isProduction: false,
      nodeEnv: "development",
    });
    expect(result).toBe(true);
    expect(sentryState.initializedDsn).toBe(
      "https://sentry-dsn@test.ingest.sentry.io/123"
    );
  });

  it("should set environment from nodeEnv", () => {
    initialiseSentry({
      dsn: "https://key@test.ingest.sentry.io/123",
      isProduction: false,
      nodeEnv: "staging",
    });
    expect(sentryState.environment).toBe("staging");
  });

  it("should default environment to production when nodeEnv is undefined", () => {
    initialiseSentry({
      dsn: "https://key@test.ingest.sentry.io/123",
      isProduction: true,
      nodeEnv: undefined as unknown as string,
    });
    expect(sentryState.environment).toBe("production");
  });

  it("should set tracesSampleRate to 1.0 in development", () => {
    initialiseSentry({
      dsn: "https://key@test.ingest.sentry.io/123",
      isProduction: false,
      nodeEnv: "development",
    });
    expect(sentryState.tracesSampleRate).toBe(1.0);
  });

  it("should set tracesSampleRate to 0.1 in production", () => {
    initialiseSentry({
      dsn: "https://key@test.ingest.sentry.io/123",
      isProduction: true,
      nodeEnv: "production",
    });
    expect(sentryState.tracesSampleRate).toBe(0.1);
  });

  it("should include local variables in non-production", () => {
    initialiseSentry({
      dsn: "https://key@test.ingest.sentry.io/123",
      isProduction: false,
      nodeEnv: "development",
    });
    expect(sentryState.includeLocalVariables).toBe(true);
  });

  it("should not include local variables in production", () => {
    initialiseSentry({
      dsn: "https://key@test.ingest.sentry.io/123",
      isProduction: true,
      nodeEnv: "production",
    });
    expect(sentryState.includeLocalVariables).toBe(false);
  });
});

describe("sentryErrorHandler", () => {
  it("should return a function", () => {
    const handler = sentryErrorHandler();
    expect(typeof handler).toBe("function");
  });

  it("should return a 500 error response", () => {
    const handler = sentryErrorHandler();
    let statusCode = 0;
    let responseBody: unknown;

    const mockRes = {
      status(code: number) {
        statusCode = code;
        return {
          json(body: unknown) {
            responseBody = body;
          },
        };
      },
    };

    handler(new Error("test error"), {}, mockRes as never, (): void => {});

    expect(statusCode).toBe(500);
    expect(responseBody).toEqual({ error: "Internal Server Error" });
  });
});
