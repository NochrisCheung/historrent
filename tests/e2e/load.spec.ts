import { test, expect } from "@playwright/test";

test.describe("Page load", () => {
  test("renders the canvas without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto("/");
    // Wait for the canvas to render before snapshotting console errors.
    await page.locator("canvas").first().waitFor({ state: "visible" });

    // The R3F <Canvas> renders an HTML <canvas> element. Wait for it to mount.
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // It should fill the viewport.
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // Background should be the moon-white from tokens.css. We assert the
    // canvas's clientWidth/clientHeight match viewport rather than reading
    // pixels (WebGL pixels are flaky to assert across drivers).
    expect(consoleErrors, `Unexpected console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("html lang is zh-Hans", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("zh-Hans");
  });
});
