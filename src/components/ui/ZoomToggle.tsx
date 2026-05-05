"use client";

import { useTranslations } from "next-intl";
import { useCameraStore, type Granularity } from "@/state/cameraStore";
import styles from "./ZoomToggle.module.css";

const OPTIONS: ReadonlyArray<{ value: Granularity; key: "year" | "month" | "day" }> = [
  { value: "year", key: "year" },
  { value: "month", key: "month" },
  { value: "day", key: "day" },
];

/**
 * Bottom-centre segmented toggle: 年 / 月 / 日. Sets `granularity` on
 * `useCameraStore`; `<CameraController>` springs `viewportWorldWidth` to
 * the matching value.
 */
export function ZoomToggle() {
  const t = useTranslations("zoomToggle");
  const granularity = useCameraStore((s) => s.granularity);
  const setGranularity = useCameraStore((s) => s.setGranularity);

  return (
    <div
      className={styles.toggle}
      role="group"
      aria-label={t("ariaLabel")}
      data-testid="zoom-toggle"
    >
      {OPTIONS.map(({ value, key }) => (
        <button
          key={value}
          type="button"
          className={styles.option}
          aria-pressed={granularity === value}
          data-granularity={value}
          onClick={() => setGranularity(value)}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
