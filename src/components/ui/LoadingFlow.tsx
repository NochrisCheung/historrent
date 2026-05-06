"use client";

import { useUiStore } from "@/state/uiStore";
import { ErrorOverlay } from "./ErrorOverlay";
import { LoadingOrchestrator } from "./LoadingOrchestrator";
import { LoadingScreen } from "./LoadingScreen";

/**
 * Phase 10 entry point. Composes:
 *
 *  - `<LoadingOrchestrator>` (renders nothing) — drives the loadingStatus
 *    state through fonts → data → canvas → ready.
 *  - `<LoadingScreen>` — full-viewport overlay while status is in flight.
 *  - `<ErrorOverlay>` — renders when status is `"error"` (orchestrator hit
 *    a recoverable problem). The Next.js error boundary
 *    (`src/app/error.tsx`) handles unhandled exceptions separately.
 *
 * Mounted from `page.tsx`. Single client island so the page itself stays
 * server-rendered.
 */
export function LoadingFlow() {
  const status = useUiStore((s) => s.loadingStatus);

  return (
    <>
      <LoadingOrchestrator />
      <LoadingScreen />
      {status === "error" && <ErrorOverlay />}
    </>
  );
}
