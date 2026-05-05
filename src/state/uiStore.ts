/**
 * UI state — language toggle and other cross-cutting UI preferences.
 *
 * Lives separately from `timelineStore` (canvas state) so updates to
 * either don't trigger re-renders in the other. Persisted to sessionStorage
 * (per Phase 1's "no per-user state across sessions" decision —
 * implementation_plan §1.2). On a fresh tab the user gets the default.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Language = "zh-Hans" | "zh-Hant";

interface UiState {
  language: Language;
}

interface UiActions {
  setLanguage: (language: Language) => void;
  reset: () => void;
}

const INITIAL_STATE: UiState = {
  language: "zh-Hans",
};

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setLanguage: (language) => set({ language }),
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
