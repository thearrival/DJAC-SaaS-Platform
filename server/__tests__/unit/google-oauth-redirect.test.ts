import { describe, it, expect } from "vitest";
import { safeRedirectTo } from "../../_core/google-oauth";

describe("Google OAuth redirect guard", () => {
  it("accepts same-origin absolute paths", () => {
    expect(safeRedirectTo("/dashboard")).toBe("/dashboard");
    expect(safeRedirectTo("/yalla-hack-owners-console/users")).toBe(
      "/yalla-hack-owners-console/users"
    );
  });

  it("rejects protocol-relative URLs (open-redirect vector)", () => {
    expect(safeRedirectTo("//evil.example.com")).toBe("/dashboard");
    expect(safeRedirectTo("//evil.example.com/x")).toBe("/dashboard");
  });

  it("rejects absolute URLs to other origins", () => {
    expect(safeRedirectTo("https://evil.example.com")).toBe("/dashboard");
    expect(safeRedirectTo("http://evil.example.com")).toBe("/dashboard");
    expect(safeRedirectTo("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects non-strings and empty values", () => {
    expect(safeRedirectTo(undefined)).toBe("/dashboard");
    expect(safeRedirectTo(null)).toBe("/dashboard");
    expect(safeRedirectTo("")).toBe("/dashboard");
    expect(safeRedirectTo(42)).toBe("/dashboard");
    expect(safeRedirectTo(["//evil.com"])).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeRedirectTo("//evil.com", "/")).toBe("/");
  });
});
