import { describe, it, expect } from "vitest";
import { yearToWorld } from "./yearToWorld";
import {
  LIU_BANG_BORN,
  LIU_BANG_DIED,
  TIMELINE_WORLD_HALF_WIDTH,
} from "@/shared/constants/timeline";

describe("yearToWorld", () => {
  it("maps the birth year to the left edge of the lifespan range", () => {
    expect(yearToWorld(LIU_BANG_BORN)).toBe(-TIMELINE_WORLD_HALF_WIDTH);
  });

  it("maps the death year to the right edge of the lifespan range", () => {
    expect(yearToWorld(LIU_BANG_DIED)).toBe(TIMELINE_WORLD_HALF_WIDTH);
  });

  it("maps the midpoint year to world-x within half a year-step of 0", () => {
    // Liu Bang's lifespan is 61 years (odd), so the rounded midpoint year is
    // half a year off the mathematical centre. A "year step" in world-x is
    // (2 * halfWidth) / lifespan; half of that is the maximum offset.
    const midYear = Math.round((LIU_BANG_BORN + LIU_BANG_DIED) / 2);
    const yearStep = (2 * TIMELINE_WORLD_HALF_WIDTH) / Math.abs(LIU_BANG_DIED - LIU_BANG_BORN);
    expect(Math.abs(yearToWorld(midYear))).toBeLessThanOrEqual(yearStep / 2 + 1e-9);
  });

  it("interpolates linearly between birth and death", () => {
    const quarterYear = LIU_BANG_BORN + Math.round((LIU_BANG_DIED - LIU_BANG_BORN) / 4);
    expect(yearToWorld(quarterYear)).toBeCloseTo(-0.5 * TIMELINE_WORLD_HALF_WIDTH, 1);
  });

  it("returns x < -halfWidth for years before Liu Bang's birth", () => {
    expect(yearToWorld(LIU_BANG_BORN - 1)).toBeLessThan(-TIMELINE_WORLD_HALF_WIDTH);
  });

  it("returns x > +halfWidth for years after Liu Bang's death", () => {
    expect(yearToWorld(LIU_BANG_DIED + 1)).toBeGreaterThan(TIMELINE_WORLD_HALF_WIDTH);
  });
});
