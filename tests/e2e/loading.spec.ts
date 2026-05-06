import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 10 — loading screen + error overlay.
 *
 * The orchestrator's stages tick fast in a real browser, so by the time
 * Playwright's smoke check runs, status is already `"ready"`. We assert
 * the eventual ready state (loading screen unmounted, canvas visible)
 * and exercise the error path through the test affordance
 * `window.__historrentForceLoadingError()`.
 */

async function readLoadingStatus(page: Page): Promise<string> {
  return page.evaluate(() => {
    const ui = (
      window as unknown as {
        __historrentUiStore?: { getState: () => { loadingStatus: string } };
      }
    ).__historrentUiStore;
    if (!ui) throw new Error("__historrentUiStore not exposed");
    return ui.getState().loadingStatus;
  });
}

test.describe("Loading flow (Phase 10)", () => {
  test("orchestrator transitions to ready and dismisses the loading screen", async ({ page }) => {
    await page.goto("/");

    // Eventually the orchestrator reaches `ready`. Polling is robust to
    // the few rAFs the sequence takes.
    await expect.poll(async () => readLoadingStatus(page), { timeout: 5000 }).toBe("ready");

    // After fade-out the overlay element is removed from the DOM.
    await expect(page.getByTestId("loading-screen")).toHaveCount(0);

    // Canvas underneath is interactive.
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
  });

  test("force-error → ErrorOverlay shows; retry button triggers a reload", async ({ page }) => {
    await page.goto("/");
    // Wait for the orchestrator to settle on a determinate state first.
    await expect
      .poll(async () => readLoadingStatus(page), { timeout: 5000 })
      .toMatch(/ready|error/);

    // Simulate the orchestrator hitting an unrecoverable problem.
    await page.evaluate(() => {
      const force = (window as unknown as { __historrentForceLoadingError?: () => void })
        .__historrentForceLoadingError;
      if (!force) throw new Error("__historrentForceLoadingError not exposed");
      force();
    });

    await expect(page.getByTestId("error-overlay")).toBeVisible();
    await expect(page.getByTestId("error-overlay")).toContainText("出错了");

    // Retry triggers `window.location.reload()` — wait for the page to
    // come back, the store to re-expose, the orchestrator to reach `ready`.
    await page.getByTestId("error-overlay-retry").click();
    await page.waitForLoadState("load");
    await page.waitForFunction(() =>
      Boolean((window as { __historrentUiStore?: unknown }).__historrentUiStore),
    );
    await expect.poll(async () => readLoadingStatus(page), { timeout: 5000 }).toBe("ready");
    await expect(page.getByTestId("error-overlay")).toHaveCount(0);
  });
});
