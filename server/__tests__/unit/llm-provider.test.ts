/**
 * LLM provider selection guard.
 *
 * Ensures the AI layer picks DeepSeek when DEEPSEEK_API_KEY is configured and
 * falls back to the Forge gateway otherwise — so a provider regression can never
 * silently break the compliance chat, AI agents, or report generation.
 */

import { describe, it, expect } from "vitest";
import { resolveLlmProvider } from "../../_core/llm";

const base = {
  deepseekApiKey: "",
  deepseekBaseUrl: "https://api.deepseek.com",
  deepseekModel: "deepseek-chat",
  forgeApiUrl: "https://forge.example.dev",
  forgeApiKey: "forge-key",
};

describe("resolveLlmProvider", () => {
  it("prefers DeepSeek when a key is configured", () => {
    const p = resolveLlmProvider({ ...base, deepseekApiKey: "sk-test" });
    expect(p.name).toBe("deepseek");
    expect(p.url).toBe("https://api.deepseek.com/chat/completions");
    expect(p.apiKey).toBe("sk-test");
    expect(p.model).toBe("deepseek-chat");
    expect(p.maxTokensLimit).toBe(8192);
    expect(p.supportsThinking).toBe(false);
  });

  it("defaults the DeepSeek model when unset", () => {
    const p = resolveLlmProvider({
      ...base,
      deepseekApiKey: "sk-test",
      deepseekModel: "",
    });
    expect(p.model).toBe("deepseek-chat");
  });

  it("falls back to Forge when no DeepSeek key is set", () => {
    const p = resolveLlmProvider(base);
    expect(p.name).toBe("forge");
    expect(p.url).toBe("https://forge.example.dev/v1/chat/completions");
    expect(p.apiKey).toBe("forge-key");
    expect(p.supportsThinking).toBe(true);
  });

  it("uses the default Forge URL when none is configured", () => {
    const p = resolveLlmProvider({ ...base, forgeApiUrl: "" });
    expect(p.name).toBe("forge");
    expect(p.url).toBe("https://forge.manus.im/v1/chat/completions");
  });

  it("strips a trailing slash from the DeepSeek base URL", () => {
    const p = resolveLlmProvider({
      ...base,
      deepseekApiKey: "sk-test",
      deepseekBaseUrl: "https://api.deepseek.com/",
    });
    expect(p.url).toBe("https://api.deepseek.com/chat/completions");
  });
});
