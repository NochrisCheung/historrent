import { describe, it, expect } from "vitest";
import {
  screenXToWorldX,
  cameraXToKeepWorldAt,
  applyWheelZoom,
  dragDeltaToWorldX,
} from "./cameraMath";

describe("screenXToWorldX", () => {
  it("at canvas centre returns cameraX", () => {
    expect(screenXToWorldX(500, 1000, 3, 12)).toBe(3);
  });

  it("at left edge returns cameraX − viewportWidth/2", () => {
    expect(screenXToWorldX(0, 1000, 3, 12)).toBeCloseTo(3 - 6, 10);
  });

  it("at right edge returns cameraX + viewportWidth/2", () => {
    expect(screenXToWorldX(1000, 1000, 3, 12)).toBeCloseTo(3 + 6, 10);
  });
});

describe("cameraXToKeepWorldAt", () => {
  it("is the inverse of screenXToWorldX for the same screen point", () => {
    const canvasWidth = 1000;
    const cameraX = 3;
    const oldWidth = 12;
    const newWidth = 6; // user zoomed in 2×
    const screenX = 700; // off-centre

    const worldUnderCursor = screenXToWorldX(screenX, canvasWidth, cameraX, oldWidth);
    const newCameraX = cameraXToKeepWorldAt(worldUnderCursor, screenX, canvasWidth, newWidth);
    const newWorldUnderCursor = screenXToWorldX(screenX, canvasWidth, newCameraX, newWidth);

    expect(newWorldUnderCursor).toBeCloseTo(worldUnderCursor, 10);
  });

  it("returns worldX itself when the cursor is at canvas centre", () => {
    expect(cameraXToKeepWorldAt(7, 500, 1000, 4)).toBe(7);
  });
});

describe("applyWheelZoom", () => {
  it("deltaY > 0 zooms out (returns larger width)", () => {
    expect(applyWheelZoom(1, 100, 0.001, 0.1, 10)).toBeGreaterThan(1);
  });

  it("deltaY < 0 zooms in (returns smaller width)", () => {
    expect(applyWheelZoom(1, -100, 0.001, 0.1, 10)).toBeLessThan(1);
  });

  it("clamps at the minimum", () => {
    expect(applyWheelZoom(0.5, -10000, 0.001, 0.1, 10)).toBe(0.1);
  });

  it("clamps at the maximum", () => {
    expect(applyWheelZoom(5, 10000, 0.001, 0.1, 10)).toBe(10);
  });

  it("uses an exponential curve — same factor at any zoom level", () => {
    const sensitivity = 0.001;
    const delta = 100;
    const factor = Math.exp(delta * sensitivity);
    expect(applyWheelZoom(1, delta, sensitivity, 0.001, 100)).toBeCloseTo(factor, 10);
    expect(applyWheelZoom(0.01, delta, sensitivity, 0.001, 100)).toBeCloseTo(0.01 * factor, 10);
  });
});

describe("dragDeltaToWorldX", () => {
  it("inverts cursor direction (dragging right pans world left)", () => {
    expect(dragDeltaToWorldX(100, 1000, 12)).toBeLessThan(0);
    expect(dragDeltaToWorldX(-100, 1000, 12)).toBeGreaterThan(0);
  });

  it("scales linearly with viewport width", () => {
    const a = dragDeltaToWorldX(100, 1000, 12);
    const b = dragDeltaToWorldX(100, 1000, 24);
    expect(b).toBeCloseTo(a * 2, 10);
  });
});
