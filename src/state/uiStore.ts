/**
 * UI state — language toggle and runtime loading status.
 *
 * Lives separately from `timelineStore` (canvas state) so updates to
 * either don't trigger re-renders in the other. `language` is persisted
 * to sessionStorage (per Phase 1's "no per-user state across sessions"
 * decision); `loadingStatus` is runtime-only and partialised out of
 * persist so a refreshed tab always starts at "fonts" again.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Language = "zh-Hans" | "zh-Hant";

/**
 * Phase 10 — orchestrated loading sequence.
 *
 *  - `fonts`   waiting on `document.fonts.ready`
 *  - `data`    Zod-validating the corpus
 *  - `canvas`  warming up the WebGL canvas (one render pass)
 *  - `ready`   loading screen dismissed; app is interactive
 *  - `error`   the orchestrator hit an unrecoverable problem; the
 *              `<ErrorOverlay>` takes over from the LoadingScreen
 */
export type LoadingStatus = "fonts" | "data" | "canvas" | "ready" | "error";

interface UiState {
  language: Language;
  loadingStatus: LoadingStatus;
}

interface UiActions {
  setLanguage: (language: Language) => void;
  setLoadingStatus: (status: LoadingStatus) => void;
  reset: () => void;
}

const INITIAL_STATE: UiState = {
  language: "zh-Hans",
  loadingStatus: "fonts",
};

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setLanguage: (language) => set({ language }),
      setLoadingStatus: (loadingStatus) => set({ loadingStatus }),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "historrent-ui",
      // sessionStorage clears when the tab closes — matches Phase 1's
      // "no persistence across sessions" decision.
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? // SSR fallback: in-memory storage that the persist middleware will
            // discard on the client when it rehydrates from real sessionStorage.
            {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : window.sessionStorage,
      ),
      // Only `language` is persisted — `loadingStatus` is per-load runtime
      // state and must always start fresh.
      partialize: (state) => ({ language: state.language }),
    },
  ),
);

/** Test affordance: same pattern as `timelineStore`. */
declare global {
  interface Window {
    __historrentUiStore?: typeof useUiStore;
  }
}

if (typeof window !== "undefined") {
  window.__historrentUiStore = useUiStore;
}
