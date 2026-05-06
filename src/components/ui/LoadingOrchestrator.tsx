"use client";

import { useEffect } from "react";
import { useUiStore } from "@/state/uiStore";

/**
 * Drives the Phase 10 loading sequence. Mounts once on the root page,
 * renders nothing.
 *
 * Sequence:
 *   fonts   — wait on `document.fonts.ready` (with a fail-safe timeout)
 *   data    — Liu Bang corpus is parsed at module-import time, so this
 *             stage is just a one-frame breath that lets the bar tick
 *   canvas  — wait one rAF after `data`; the R3F canvas mounts in
 *             parallel, so by this point its `onCreated` has fired
 *   ready   — orchestrator dismisses the loading screen
 *
 * Errors at any stage flip status to `"error"`, handing off to
 * `<ErrorOverlay>`. Unhandled exceptions in children of the page bubble
 * up to `src/app/error.tsx` (Next.js error boundary), which also renders
 * the same overlay.
 *
 * Test affordance: `window.__historrentForceLoadingError` lets E2E
 * specs trip the orchestrator into error state without faking a font
 * download. Mirrors the pattern used elsewhere
 * (`__historrentCorpus`, `__historrentCameraStore`).
 */

const FONT_TIMEOUT_MS = 8000;

declare global {
  interface Window {
    __historrentForceLoadingError?: () => void;
  }
}

export function LoadingOrchestrator() {
  const setLoadingStatus = useUiStore((s) => s.setLoadingStatus);

  useEffect(() => {
    let cancelled = false;
    const transition = (next: Parameters<typeof setLoadingStatus>[0]) => {
      if (!cancelled) setLoadingStatus(next);
    };

    if (typeof window !== "undefined") {
      window.__historrentForceLoadingError = () => transition("error");
    }

    async function run() {
      try {
        // 1. fonts → wait on `document.fonts.ready` with a timeout fallback.
        if (typeof document !== "undefined" && document.fonts) {
          await Promise.race([
            document.fonts.ready,
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error("font-load-timeout")), FONT_TIMEOUT_MS),
            ),
          ]);
        }
        if (cancelled) return;

        // 2. data — corpus already parsed by `liu_bang.ts` import. One rAF
        // gives the bar a beat to tick to "data".
        transition("data");
        await nextFrame();
        if (cancelled) return;

        // 3. canvas — R3F canvas has mounted alongside us; one more rAF
        // ensures its first render has flushed.
        transition("canvas");
        await nextFrame();
        if (cancelled) return;

        // 4. ready — dismiss the loading screen.
        transition("ready");
      } catch {
        transition("error");
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        delete window.__historrentForceLoadingError;
      }
    };
  }, [setLoadingStatus]);

  return null;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 16);
    }
  });
}
