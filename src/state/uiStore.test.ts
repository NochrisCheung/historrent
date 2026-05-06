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

  it("starts in loadingStatus=fonts", () => {
    expect(useUiStore.getState().loadingStatus).toBe("fonts");
  });

  it("setLoadingStatus updates the runtime status", () => {
    useUiStore.getState().setLoadingStatus("data");
    expect(useUiStore.getState().loadingStatus).toBe("data");
    useUiStore.getState().setLoadingStatus("ready");
    expect(useUiStore.getState().loadingStatus).toBe("ready");
  });

  it("does NOT persist loadingStatus (partialize keeps only language)", () => {
    useUiStore.getState().setLoadingStatus("ready");
    useUiStore.getState().setLanguage("zh-Hant");
    const raw = sessionStorage.getItem("historrent-ui");
    expect(raw).not.toBeNull();
    expect(raw).toContain("zh-Hant");
    // loadingStatus must NOT appear in the persisted blob — a fresh tab
    // always starts a new load sequence.
    expect(raw).not.toContain("loadingStatus");
  });

  it("exposes itself on window for E2E", () => {
    expect(window.__historrentUiStore).toBe(useUiStore);
  });
});
