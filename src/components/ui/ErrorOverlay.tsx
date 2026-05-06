"use client";

import { useTranslations } from "next-intl";
import styles from "./ErrorOverlay.module.css";

export interface ErrorOverlayProps {
  /**
   * Optional override for the error message. When omitted, the localised
   * default copy is used (per `loading.errorMessage`).
   */
  message?: string;
  /**
   * What "retry" should do. Defaults to a full page reload — appropriate
   * for orchestrator-level errors. Next.js's `app/error.tsx` boundary
   * supplies its own `reset()` callback instead.
   */
  onRetry?: () => void;
}

/**
 * Centred error card on a near-opaque canvas-bg overlay (`color-mix` at
 * 95 %). Used in two places:
 *
 *  - inline by `<page.tsx>` when `loadingStatus === "error"` — the
 *    orchestrator hit a recoverable problem (font timeout, etc.).
 *  - by `src/app/error.tsx` when an unhandled exception bubbles out of
 *    the page tree; in that case Next.js supplies the `reset()` cb.
 */
export function ErrorOverlay({ message, onRetry }: ErrorOverlayProps) {
  const t = useTranslations("loading");
  const handleRetry = onRetry ?? (() => window.location.reload());

  return (
    <div
      className={styles.overlay}
      data-testid="error-overlay"
      role="alertdialog"
      aria-labelledby="error-overlay-title"
    >
      <div className={styles.card}>
        <h2 id="error-overlay-title" className={styles.title}>
          {t("errorTitle")}
        </h2>
        <p className={styles.message}>{message ?? t("errorMessage")}</p>
        <button
          type="button"
          className={styles.retry}
          onClick={handleRetry}
          data-testid="error-overlay-retry"
        >
          {t("errorRetry")}
        </button>
      </div>
    </div>
  );
}
