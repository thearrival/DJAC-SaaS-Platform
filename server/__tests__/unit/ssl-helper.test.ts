import { describe, it, expect } from "vitest";

const fixSslMode = (url: string): string => {
  if (!url) return url;
  if (url.includes("sslmode")) {
    return url.replace(/sslmode=[^&]+/g, "sslmode=no-verify");
  }
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + "sslmode=no-verify";
};

describe("fixSslMode", () => {
  it("should return empty string for empty input", () => {
    expect(fixSslMode("")).toBe("");
  });

  it("should replace existing sslmode with no-verify", () => {
    const result = fixSslMode(
      "postgres://user:pass@host:5432/db?sslmode=require"
    );
    expect(result).toContain("sslmode=no-verify");
    expect(result).not.toContain("sslmode=require");
  });

  it("should replace any sslmode variant", () => {
    const inputs = [
      "sslmode=require",
      "sslmode=verify-ca",
      "sslmode=verify-full",
      "sslmode=prefer",
      "sslmode=disable",
    ];
    for (const sslmode of inputs) {
      const url = `postgres://user:pass@host:5432/db?${sslmode}`;
      const result = fixSslMode(url);
      expect(result).toContain("sslmode=no-verify");
      expect(result.match(/sslmode=/g)!.length).toBe(1);
    }
  });

  it("should append sslmode when no existing sslmode", () => {
    const result = fixSslMode("postgres://user:pass@host:5432/db");
    expect(result).toBe("postgres://user:pass@host:5432/db?sslmode=no-verify");
  });

  it("should append with & when URL already has query params without sslmode", () => {
    const result = fixSslMode(
      "postgres://user:pass@host:5432/db?connect_timeout=10"
    );
    expect(result).toBe(
      "postgres://user:pass@host:5432/db?connect_timeout=10&sslmode=no-verify"
    );
  });

  it("should handle URLs with complex connection strings", () => {
    const url =
      "postgres://user:pass@host:5432/db?sslmode=require&connect_timeout=10&application_name=test";
    const result = fixSslMode(url);
    expect(result).toContain("sslmode=no-verify");
    expect(result).toContain("connect_timeout=10");
    expect(result).toContain("application_name=test");
  });

  it("should handle URLs with no query string", () => {
    const result = fixSslMode("postgresql://localhost/mydb");
    expect(result).toBe("postgresql://localhost/mydb?sslmode=no-verify");
  });

  it("should handle URLs with trailing slash", () => {
    const result = fixSslMode("postgres://user:pass@host:5432/db/");
    expect(result).toContain("sslmode=no-verify");
  });

  it("should handle sslmode at the end of URL", () => {
    const result = fixSslMode(
      "postgres://user:pass@host:5432/db?sslmode=require"
    );
    expect(result.split("?")[1]).toBe("sslmode=no-verify");
  });

  it("should not duplicate sslmode", () => {
    const single = fixSslMode("postgres://host/db?sslmode=require");
    const twice = fixSslMode(fixSslMode("postgres://host/db?sslmode=require"));
    expect(single).toBe(twice);
    expect(single.match(/sslmode=/g)!.length).toBe(1);
  });
});
