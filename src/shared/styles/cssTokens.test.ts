import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readCssToken } from "./cssTokens";

describe("readCssToken", () => {
  const FALLBACK = "#fallback";

  beforeEach(() => {
    document.documentElement.style.setProperty("--probe-token", "#abcdef");
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--probe-token");
  });

  it("reads a defined CSS variable from :root", () => {
    expect(readCssToken("--probe-token", FALLBACK)).toBe("#abcdef");
  });

  it("returns the fallback when the variable is undefined", () => {
    expect(readCssToken("--no-such-token", FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback when the variable resolves to an empty string", () => {
    document.documentElement.style.setProperty("--empty-token", "");
    expect(readCssToken("--empty-token", FALLBACK)).toBe(FALLBACK);
    document.documentElement.style.removeProperty("--empty-token");
  });
});
