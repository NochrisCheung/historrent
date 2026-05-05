"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCameraStore, type Granularity } from "@/state/cameraStore";
import { WORLD_PER_YEAR } from "@/shared/constants/timeline";
import styles from "./IntervalLegend.module.css";

/**
 * Map-style scale bar (Phase 8.5.3). Bottom-left fixed overlay showing
 * "one decade / one year / one month" worth of pixels at the current zoom,
 * so the user always has a quantitative readout of the timeline scale.
 *
 *  - `year` zoom → 10-year bar, label `10 年`
 *  - `month` zoom → 1-year bar, label `1 年`
 *  - `day` zoom → 1-month bar, label `1 月`
 *
 * Bar pixel width is recomputed each render from `viewportWorldWidth`
 * (continuous wheel zoom + spring snap) and the visible canvas width
 * (≈ `window.innerWidth` since the canvas is full-viewport). Label and
 * interval are fixed per granularity, so the label only changes at the
 * 220ms snap. The unit characters 年 / 月 are universal across Hans/Hant;
 * only the aria-label is i18n'd.
 */

interface LegendInterval {
  /** World units the bar represents at the current granularity. */
  worldUnits: number;
  /** Localised-by-character label (年/月 are universal). */
  label: string;
}

const ONE_MONTH_IN_YEARS = 1 / 12;

const LEGEND_BY_GRANULARITY: Record<Granularity, LegendInterval> = {
  year: { worldUnits: 10 * WORLD_PER_YEAR, label: "10 年" },
  month: { worldUnits: 1 * WORLD_PER_YEAR, label: "1 年" },
  day: { worldUnits: ONE_MONTH_IN_YEARS * WORLD_PER_YEAR, label: "1 月" },
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
