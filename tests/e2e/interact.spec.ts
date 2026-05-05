import { test, expect, type Page } from "@playwright/test";

/**
 * Local view of the global `window.__historrentStore` used in
 * `page.evaluate` blocks. The canonical declare-global lives in
 * `src/state/timelineStore.ts`; we reach for a structural slice here
 * to avoid pulling that file (or its Zustand types) into the Playwright
 * tsconfig.
 */
type StoreSnapshot = { hoveredId: string | null; selectedId: string | null };
type StoreHandle = { getState: () => StoreSnapshot };

/**
 * Move the cursor to the centre of the dot for the event with id `eventId`.
 *
 * The dot is a WebGL primitive (no DOM element of its own) but its sibling
 * `<Html>` label is a real DOM node tagged `data-event-label="${id}"`. The
 * label sits a small fixed distance below the dot in screen space; this
 * helper anchors off the label's bounding rect rather than recomputing the
 * camera projection.
 */
async function hoverDot(page: Page, eventId: string) {
  const target = await page.evaluate((id) => {
    const label = document.querySelector(`[data-event-label="${id}"]`);
    if (!label) throw new Error(`No label rendered for event "${id}"`);
    const r = label.getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      // Label is rendered ~10px below the dot at the default zoom.
      y: r.top - 10,
    };
  }, eventId);
  await page.mouse.move(target.x, target.y);
  return target;
}

async function readStore(page: Page): Promise<StoreSnapshot> {
  return page.evaluate(() => {
    const store = (window as unknown as { __historrentStore?: StoreHandle }).__historrentStore;
    if (!store) throw new Error("__historrentStore not exposed");
    return store.getState();
  });
}

test.describe("Item interaction", () => {
  test("hover sets hoveredId; moving away clears it", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    // Wait for the labels to lay out before reading their positions.
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    await hoverDot(page, "imperial-accession");
    await expect.poll(async () => (await readStore(page)).hoveredId).toBe("imperial-accession");

    await page.mouse.move(0, 0);
    await expect.poll(async () => (await readStore(page)).hoveredId).toBeNull();
  });

  test("click sets selectedId; clicking a different item changes it", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    await hoverDot(page, "imperial-accession");
    await expect.poll(async () => (await readStore(page)).hoveredId).toBe("imperial-accession");
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(async () => (await readStore(page)).selectedId).toBe("imperial-accession");

    await hoverDot(page, "hongmen-banquet");
    await expect.poll(async () => (await readStore(page)).hoveredId).toBe("hongmen-banquet");
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(async () => (await readStore(page)).selectedId).toBe("hongmen-banquet");
  });

  test("the event's name and year are rendered as a DOM label below the dot", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });

    const labels = page.locator("[data-event-label]");
    await expect(labels).toHaveCount(5);
    await expect(page.locator('[data-event-label="imperial-accession"]')).toContainText("即皇帝位");
    await expect(page.locator('[data-event-label="imperial-accession"]')).toContainText("前202年");
  });
});
