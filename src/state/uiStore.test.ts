import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "./uiStore";

describe("useUiStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useUiStore.getState().reset();
  });

  it("starts in zh-Hans", () => {
    expect(useUiStore.getState().language).toBe("zh-Hans");
  });

  it("setLanguage flips to zh-Hant and back", () => {
    useUiStore.getState().setLanguage("zh-Hant");
    expect(useUiStore.getState().language).toBe("zh-Hant");
    useUiStore.getState().setLanguage("zh-Hans");
    expect(useUiStore.getState().language).toBe("zh-Hans");
  });

  it("persists to sessionStorage", () => {
    useUiStore.getState().setLanguage("zh-Hant");
    const raw = sessionStorage.getItem("historrent-ui");
    expect(raw).not.toBeNull();
    expect(raw).toContain("zh-Hant");
  });

  it("exposes itself on window for E2E", () => {
    expect(window.__historrentUiStore).toBe(useUiStore);
  });
});
