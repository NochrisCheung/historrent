"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useUiStore, type LoadingStatus } from "@/state/uiStore";
import styles from "./LoadingScreen.module.css";

const FADE_DURATION = 0.32;

/**
 * Full-viewport overlay shown until the orchestrator transitions
 * `loadingStatus` to `"ready"`. A thin progress bar fills as the
 * sequence advances (fonts → data → canvas → ready); status text
 * below the bar reflects the active stage.
 *
 * Hidden when status is `"ready"` (canvas takes over) or `"error"`
 * (`<ErrorOverlay>` takes over).
 */
export function LoadingScreen() {
  const status = useUiStore((s) => s.loadingStatus);
  const t = useTranslations("loading");

  const visible = status !== "ready" && status !== "error";
  const progress = progressFor(status);
  const label = labelFor(status, t);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-screen"
          className={styles.overlay}
          data-testid="loading-screen"
          data-loading-status={status}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION }}
          role="status"
          aria-live="polite"
        >
          <div className={styles.barTrack} aria-hidden>
            <div
              className={styles.barFill}
              style={{ width: `${progress}%` }}
              data-progress={progress}
            />
          </div>
          <p className={styles.status} data-testid="loading-status-text">
            {label}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function progressFor(status: LoadingStatus): number {
  switch (status) {
    case "fonts":
      return 25;
    case "data":
      return 55;
    case "canvas":
      return 85;
    case "ready":
      return 100;
    case "error":
      return 100;
  }
}

function labelFor(status: LoadingStatus, t: (key: string) => string): string {
  switch (status) {
    case "fonts":
      return t("fonts");
    case "data":
      return t("data");
    case "canvas":
      return t("canvas");
    case "ready":
    case "error":
      return "";
  }
}
