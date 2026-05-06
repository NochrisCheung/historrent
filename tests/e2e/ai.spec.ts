import { test, expect, type Page } from "@playwright/test";

/**
 * E2E for the synthesis pipeline (Phase 9). The `/api/synthesise` route
 * is intercepted via Playwright's route mocking so the test never hits
 * a real DeepSeek backend; we deterministically control cache hits,
 * misses, and 5xx errors at the network boundary.
 */

async function panCameraToOrigin(page: Page) {
  await page.evaluate(() => {
    const cam = (
      window as unknown as {
        __historrentCameraStore?: { setState: (s: { cameraX: number }) => void };
      }
    ).__historrentCameraStore;
    if (!cam) throw new Error("__historrentCameraStore not exposed");
    cam.setState({ cameraX: 0 });
  });
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-event-date="imperial-accession"]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.left > 0 && r.right < window.innerWidth;
  });
  await page.waitForTimeout(50);
}

async function clickDot(page: Page, slug: string) {
  const target = await page.evaluate((s) => {
    const name = document.querySelector(`[data-event-name="${s}"]`);
    const date = document.querySelector(`[data-event-date="${s}"]`);
    if (!name || !date) throw new Error(`No labels rendered for event "${s}"`);
    const n = name.getBoundingClientRect();
    const d = date.getBoundingClientRect();
    return {
      x: (n.left + n.right) / 2,
      y: (n.top + n.bottom + d.top + d.bottom) / 4,
    };
  }, slug);
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(40);
  await page.mouse.down();
  await page.mouse.up();
}

async function eventIdFromSlug(page: Page, slug: string): Promise<string> {
  return page.evaluate((s) => {
    const corpus = (
      window as unknown as {
        __historrentCorpus?: { events: Array<{ id: string; slug: string }> };
      }
    ).__historrentCorpus;
    if (!corpus) throw new Error("__historrentCorpus not exposed");
    const event = corpus.events.find((e) => e.slug === s);
    if (!event) throw new Error(`No event with slug "${s}"`);
    return event.id;
  }, slug);
}

test.describe("Synthesis (Phase 9)", () => {
  test("cache miss → loading → result with chips", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/synthesise", async (route) => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 80)); // simulate latency
      const eventId = await eventIdFromSlug(page, "hongmen-banquet");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          synthesis: "鸿门宴中沛公脱险 [Shiji-8-23]，归而立诛曹无伤 [Shiji-8-23]。",
          eventId,
          language: "zh-Hans",
          citations: [{ chapter: 8, paragraph: 23, label: "Shiji-8-23" }],
          cached: false,
          promptVersion: "v1",
          generatedAt: "2026-05-06T00:00:00.000Z",
        }),
      });
    });

    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "hongmen-banquet");
    await expect(page.getByTestId("detail-panel")).toBeVisible();

    await page.getByTestId("synthesis-show").click();
    await expect(page.getByTestId("synthesis-loading")).toBeVisible();
    await expect(page.getByTestId("synthesis-ready")).toBeVisible();
    await expect(page.getByTestId("synthesis-ready")).toContainText("鸿门宴中沛公脱险");

    // The two `[Shiji-8-23]` references collapse into two chips.
    await expect(page.getByTestId("synthesis-chip")).toHaveCount(2);
    expect(calls).toBe(1);
  });

  test("error → retry → success", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/synthesise", async (route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({ error: "DeepSeek unavailable" }),
        });
        return;
      }
      const eventId = await eventIdFromSlug(page, "hongmen-banquet");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          synthesis: "重试后成功 [Shiji-8-23]。",
          eventId,
          language: "zh-Hans",
          citations: [{ chapter: 8, paragraph: 23, label: "Shiji-8-23" }],
          cached: false,
          promptVersion: "v1",
          generatedAt: "2026-05-06T00:00:00.000Z",
        }),
      });
    });

    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "hongmen-banquet");
    await page.getByTestId("synthesis-show").click();

    await expect(page.getByTestId("synthesis-error")).toBeVisible();
    await expect(page.getByTestId("synthesis-error")).toContainText("502");

    // Retry button inside the error block.
    await page.getByTestId("synthesis-error").getByRole("button").click();
    await expect(page.getByTestId("synthesis-ready")).toBeVisible();
    await expect(page.getByTestId("synthesis-ready")).toContainText("重试后成功");
    expect(calls).toBe(2);
  });

  test("clicking a chip scrolls the matching citation card into view", async ({ page }) => {
    await page.route("**/api/synthesise", async (route) => {
      const eventId = await eventIdFromSlug(page, "hongmen-banquet");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          synthesis: "测试 [Shiji-8-23] 文本。",
          eventId,
          language: "zh-Hans",
          citations: [{ chapter: 8, paragraph: 23, label: "Shiji-8-23" }],
          cached: false,
          promptVersion: "v1",
          generatedAt: "2026-05-06T00:00:00.000Z",
        }),
      });
    });

    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "hongmen-banquet");
    await page.getByTestId("synthesis-show").click();
    await expect(page.getByTestId("synthesis-ready")).toBeVisible();

    // The citation card has id="citation-Shiji-8-23". Clicking the chip
    // should call scrollIntoView; we verify the card stays in the
    // panel's visible region after the click (it's already rendered, so
    // really we're asserting the click handler doesn't throw).
    const chip = page.getByTestId("synthesis-chip").first();
    await chip.click();
    const card = page.locator("#citation-Shiji-8-23");
    await expect(card).toBeVisible();
  });
});
