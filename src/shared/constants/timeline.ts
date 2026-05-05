/**
 * Shared constants for the Liu Bang timeline geometry.
 * Phase 2 (`yearToWorld.ts`) and Phase 1 (`CameraRig.tsx`) both depend on these.
 */

/**
 * Liu Bang's lifespan, in colloquial signed BCE.
 * Negative = BCE. -256 means 256 BCE.
 * See implementation_plan §3.3 ("Year-numbering convention").
 */
export const LIU_BANG_BORN = -256;
export const LIU_BANG_DIED = -195;
export const LIU_BANG_LIFESPAN = LIU_BANG_DIED - LIU_BANG_BORN; // 61 years

/**
 * The lifespan is mapped to this world-x range.
 * (Phase 2 `yearToWorld.ts` consumes this; the camera rig calibrates to
 * include this range plus margin.)
 */
export const TIMELINE_WORLD_HALF_WIDTH = 5; // span runs from -5 to +5

/**
 * World units per calendar year. The lifespan (`LIU_BANG_LIFESPAN` years)
 * spans `2 × TIMELINE_WORLD_HALF_WIDTH` world units, so one year is
 * `(2 × half-width) / lifespan` world units. Used by the IntervalLegend
 * to convert "n years" → world units → screen pixels.
 */
export const WORLD_PER_YEAR = (2 * TIMELINE_WORLD_HALF_WIDTH) / LIU_BANG_LIFESPAN;

/**
 * Half-extent of the rendered timeline string mesh. The string deliberately
 * extends well beyond the lifespan (TIMELINE_WORLD_HALF_WIDTH) so the
 * "flying-scarf" curl/wobble has room to develop into the off-viewport
 * past and future without the string ending mid-frame.
 */
export const TIMELINE_STRING_HALF_EXTENT = 25;

/**
 * Default-zoom margin: extra world units beyond the lifespan that the
 * viewport reveals on each side. Gives the curl room to settle into the
 * frame without the start/end events kissing the viewport edge.
 */
export const TIMELINE_VIEWPORT_MARGIN = 1;

/**
 * Total world width the default camera should encompass.
 * Used by CameraRig to compute the orthographic zoom.
 */
export const TIMELINE_VIEWPORT_WORLD_WIDTH =
  2 * TIMELINE_WORLD_HALF_WIDTH + 2 * TIMELINE_VIEWPORT_MARGIN; // 12
