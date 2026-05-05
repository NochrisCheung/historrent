"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCameraStore, type Granularity } from "@/state/cameraStore";
import { WORLD_PER_YEAR } from "@/shared/constants/timeline";
import styles from "./IntervalLegend.module.css";

/**
 * Map-style scale bar. Bottom-left fixed overlay showing one unit of the
 * currently-selected granularity (Phase 8.5.8 user revision — the bar
 * tracks the toggle one-to-one rather than picking a one-step-bigger
 * convenience interval).
 *
 *  - `year` zoom → 1-year bar, label `1 年`
 *  - `month` zoom → 1-month bar, label `1 月`
 *  - `day` zoom → 1-day bar, label `1 日`
 *
 * Bar pixel width is recomputed each render from `viewportWorldWidth`
 * (continuous wheel zoom + spring snap) and the visible canvas width
 * (≈ `window.innerWidth` since the canvas is full-viewport). Pixel
 * widths come out small (~15–25 px on a 1366-wide viewport) — that is
 * the literal "one unit at this zoom" reading; users who want a longer
 * bar can read the toggle for the unit and the legend for the scale.
 * The unit characters 年 / 月 / 日 are universal across Hans/Hant; only
 * the aria-label is i18n'd.
 */

interface LegendInterval {
  /** World units the bar represents at the current granularity. */
  worldUnits: number;
  /** Localised-by-character label (年/月/日 are universal). */
  label: string;
}

const ONE_MONTH_IN_YEARS = 1 / 12;
const ONE_DAY_IN_YEARS = 1 / 365.25;

const LEGEND_BY_GRANULARITY: Record<Granularity, LegendInterval> = {
  year: { worldUnits: 1 * WORLD_PER_YEAR, label: "1 年" },
  month: { worldUnits: ONE_MONTH_IN_YEARS * WORLD_PER_YEAR, label: "1 月" },
  day: { worldUnits: ONE_DAY_IN_YEARS * WORLD_PER_YEAR, label: "1 日" },
};

export function IntervalLegend() {
  const t = useTranslations("intervalLegend");
  const granularity = useCameraStore((s) => s.granularity);
  const viewportWorldWidth = useCameraStore((s) => s.viewportWorldWidth);

  // Canvas fills the viewport, so window.innerWidth ≈ canvas width. We
  // listen for resize so the bar width stays accurate when the user
  // resizes the window. Initial value is a sensible fallback for the
  // first paint before `useEffect` runs.
  const [canvasWidthPx, setCanvasWidthPx] = useState(1366);
  useEffect(() => {
    const update = () => setCanvasWidthPx(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const interval = LEGEND_BY_GRANULARITY[granularity];
  const barPx = (interval.worldUnits / viewportWorldWidth) * canvasWidthPx;

  return (
    <div
      className={styles.legend}
      role="img"
      aria-label={t("ariaLabel", { label: interval.label })}
      data-testid="interval-legend"
    >
      <div className={styles.bar} style={{ width: `${barPx}px` }} data-bar-px={Math.round(barPx)} />
      <div className={styles.label} data-legend-label>
        {interval.label}
      </div>
    </div>
  );
}
