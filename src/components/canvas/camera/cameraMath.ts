/**
 * Pure math helpers for the Phase 8 pan/zoom controller.
 *
 * Kept separate from React/R3F so they're trivially unit-testable. The
 * controller (`useTimelineCamera`) wires DOM events to these functions.
 */

/**
 * Convert a canvas-relative screen-x (in pixels) to the world-x coordinate
 * under that point, given the camera centre and visible viewport width.
 */
export function screenXToWorldX(
  screenX: number,
  canvasWidth: number,
  cameraX: number,
  viewportWorldWidth: number,
): number {
  const tFromCentre = (screenX - canvasWidth / 2) / canvasWidth;
  return cameraX + tFromCentre * viewportWorldWidth;
}

/**
 * Compute the camera-x that keeps `worldX` pinned under `screenX` for the
 * given viewport width. Used for cursor-anchored wheel zoom: the pixel the
 * user's pointing at represents the same world point before and after.
 */
export function cameraXToKeepWorldAt(
  worldX: number,
  screenX: number,
  canvasWidth: number,
  viewportWorldWidth: number,
): number {
  const tFromCentre = (screenX - canvasWidth / 2) / canvasWidth;
  return worldX - tFromCentre * viewportWorldWidth;
}

/**
 * Apply a wheel-delta zoom step. Returns the new viewport width.
 *  - `deltaY > 0` (wheel down / scroll away): zoom out.
 *  - `deltaY < 0` (wheel up / scroll toward): zoom in.
 *
 * The exponential mapping keeps a constant *factor* per scroll tick so the
 * felt sensitivity is the same at every zoom level.
 */
export function applyWheelZoom(
  viewportWorldWidth: number,
  deltaY: number,
  sensitivity: number,
  minWidth: number,
  maxWidth: number,
): number {
  const factor = Math.exp(deltaY * sensitivity);
  return clamp(viewportWorldWidth * factor, minWidth, maxWidth);
}

/**
 * Convert a screen-x pixel delta into a world-x delta for drag pan.
 * Positive `deltaScreenX` (cursor moves right) corresponds to negative
 * `deltaWorldX` for the camera (the world appears to scroll right under
 * the cursor, so the camera moves left).
 */
export function dragDeltaToWorldX(
  deltaScreenX: number,
  canvasWidth: number,
  viewportWorldWidth: number,
): number {
  return -(deltaScreenX / canvasWidth) * viewportWorldWidth;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}
