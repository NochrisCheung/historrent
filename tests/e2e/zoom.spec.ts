import { test, expect, type Page } from "@playwright/test";

/**
 * E2E coverage for the Phase 8 pan/zoom controller.
 *
 *  - ZoomToggle click sets `granularity`; CameraController springs
 *    `viewportWorldWidth` toward the matching value.
 *  - Mouse drag pans `cameraX`.
 *  - Wheel zoom changes `viewportWorldWidth` (cursor-anchored). After 220ms
 *    of wheel-stop the granularity snaps to the closest level.
 */

type CameraSnapshot = {
  cameraX: number;
  viewportWorldWidth: number;
  granularity: "year" | "month" | "day";
};
type CameraHandle = {
  getState: () => CameraSnapshot;
  setState: (s: Partial<CameraSnapshot>) => void;
};

async function readCamera(page: Page): Promise<CameraSnapshot> {
  return page.evaluate(() => {
    const cam = (window as unknown as { __historrentCameraStore?: CameraHandle })
      .__historrentCameraStore;
    if (!cam) throw new Error("__historrentCameraStore not exposed");
    return cam.getState();
  });
}

async function resetCamera(page: Page) {
  await page.evaluate(() => {
    const cam = (
      window as unknown as {
        __historrentCameraStore?: { getState: () => { reset: () => void } };
      }
    ).__historrentCameraStore;
    if (!cam) throw new Error("__historrentCameraStore not exposed");
    cam.getState().reset();
  });
}

test.describe("Pan/zoom controller", () => {
  test("ZoomToggle click sets granularity and animates viewportWorldWidth", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    await resetCamera(page);

    expect((await readCamera(page)).granularity).toBe("year");

    await page.locator('[data-testid="zoom-toggle"] [data-granularity="month"]').click();

    await expect.poll(async () => (await readCamera(page)).granularity).toBe("month");
    // Spring should narrow the viewport toward the month width (0.82).
    // Allow some slack — the spring may still be in flight on slower CI.
    await expect
      .poll(async () => (await readCamera(page)).viewportWorldWidth, { timeout: 3000 })
      .toBeLessThan(2);
  });

  test("mouse drag pans cameraX (right drag pans world right → cameraX decreases)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    // Give the camera controller's effects a beat to attach DOM listeners
    // (StrictMode in dev mounts effects twice; the second mount is the
    // permanent one).
    await page.waitForTimeout(200);
    await resetCamera(page);

    const before = await readCamera(page);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Drag the cursor to the right in several discrete moves. That
    // corresponds to a negative delta on cameraX (the world appears to
    // scroll right under the cursor, so the camera moves left).
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 50, cy, { steps: 3 });
    await page.mouse.move(cx + 100, cy, { steps: 3 });
    await page.mouse.move(cx + 200, cy, { steps: 3 });
    await page.mouse.up();

    await expect
      .poll(async () => (await readCamera(page)).cameraX, { timeout: 1000 })
      .toBeLessThan(before.cameraX);
  });

  test("wheel zoom (deltaY < 0) shrinks viewportWorldWidth", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    await resetCamera(page);

    const before = await readCamera(page);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    // Several large negative deltas — well above the snap threshold.
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -200);
    }

    await expect
      .poll(async () => (await readCamera(page)).viewportWorldWidth, { timeout: 1000 })
      .toBeLessThan(before.viewportWorldWidth);
  });

  test("wheel-stop snaps granularity to the nearest level", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    await resetCamera(page);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);

    // Zoom in hard enough to land near month-level (~0.82). At year width
    // 12, deltaY = -2000 with sensitivity 0.0015 multiplies width by ~e^-3
    // ≈ 0.05 in the limit, so cumulative wheel ticks easily reach month.
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -200);
    }

    // Wait past the 220ms snap debounce, then poll for the snap result.
    await page.waitForTimeout(400);
    await expect
      .poll(async () => (await readCamera(page)).granularity, { timeout: 2000 })
      .not.toBe("year");
  });
});
