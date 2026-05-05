"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useCameraStore, GRANULARITY_WIDTHS } from "@/state/cameraStore";
import { useTimelineCamera } from "./useTimelineCamera";

/**
 * Spring constants — tuned to feel like the hover spring used elsewhere
 * (see `TimelineItem`). A critically-damped-ish spring that settles in
 * roughly 400ms.
 */
const SPRING_STIFFNESS = 170;
const SPRING_DAMPING = 26;
const SPRING_MASS = 1;

const SETTLE_VALUE_EPS = 1e-4;
const SETTLE_VEL_EPS = 1e-3;
const MAX_DT = 0.06; // cap dt so a tab-switch pause doesn't catapult the spring

/**
 * Owns the imperative side of camera state:
 *
 *  - Attaches DOM wheel/drag listeners via `useTimelineCamera()`.
 *  - When `granularity` changes, animates `viewportWorldWidth` from its
 *    current value to `GRANULARITY_WIDTHS[granularity]` via a small
 *    rAF-driven spring. Each tick writes the value to `useCameraStore`
 *    and calls `invalidate()` so the canvas re-renders under
 *    `frameloop="demand"`.
 *
 * We use a hand-rolled spring rather than `@react-spring/three` because
 * the spring target needs to read from the store at tick time (so wheel
 * zoom in mid-flight isn't undone) and because we don't need the styled
 * SpringValue surface — just a number that slides into the target.
 *
 * Renders nothing — must live inside the R3F `<Canvas>` so it can read
 * `useThree`.
 */
export function CameraController() {
  useTimelineCamera();

  const granularity = useCameraStore((s) => s.granularity);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const target = GRANULARITY_WIDTHS[granularity];
    let velocity = 0;
    let lastTs = performance.now();
    let raf = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(MAX_DT, (now - lastTs) / 1000);
      lastTs = now;

      const { viewportWorldWidth, setViewportWorldWidth } = useCameraStore.getState();
      const force = -SPRING_STIFFNESS * (viewportWorldWidth - target);
      const damping = -SPRING_DAMPING * velocity;
      velocity += ((force + damping) / SPRING_MASS) * dt;
      const next = viewportWorldWidth + velocity * dt;

      if (Math.abs(next - target) < SETTLE_VALUE_EPS && Math.abs(velocity) < SETTLE_VEL_EPS) {
        setViewportWorldWidth(target);
        invalidate();
        return;
      }
      setViewportWorldWidth(next);
      invalidate();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [granularity, invalidate]);

  return null;
}
