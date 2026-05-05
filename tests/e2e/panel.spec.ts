import { test, expect, type Page } from "@playwright/test";

type StoreSnapshot = { hoveredId: string | null; selectedId: string | null };
type StoreHandle = { getState: () => StoreSnapshot };

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

async function hoverDot(page: Page, eventId: string) {
  const target = await page.evaluate((id) => {
    // Anchor off the date label (below the dot) — the dot sits ~10px above it.
    const label = document.querySelector(`[data-event-date="${id}"]`);
    if (!label) throw new Error(`No date label rendered for event "${id}"`);
    const r = label.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top - 10 };
  }, eventId);
  await page.mouse.move(target.x, target.y);
  return target;
}

async function clickDot(page: Page, eventId: string) {
  const target = await hoverDot(page, eventId);
  await page.mouse.down();
  await page.mouse.up();
  return target;
}

async function readStore(page: Page): Promise<StoreSnapshot> {
  return page.evaluate(() => {
    const store = (window as unknown as { __historrentStore?: StoreHandle }).__historrentStore;
    if (!store) throw new Error("__historrentStore not exposed");
    return store.getState();
  });
}

test.describe("Detail panel", () => {
  test("click an item → panel slides in with name, date, citation", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    // Panel starts hidden.
    await expect(page.getByTestId("detail-panel")).toHaveCount(0);

    await clickDot(page, "imperial-accession");

    const panel = page.getByTestId("detail-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("即皇帝位");
    await expect(panel).toContainText("前202年");
    await expect(panel).toContainText("甲午"); // textAnchor of the citation
    await expect(panel.locator('a[href*="ctext.org/shiji/gao-zu-ben-ji/zhs#n"]')).toHaveCount(1);
  });

  test("ESC clears the selection and slides the panel out", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "hongmen-banquet");
    await expect.poll(async () => (await readStore(page)).selectedId).toBe("hongmen-banquet");
    await expect(page.getByTestId("detail-panel")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect.poll(async () => (await readStore(page)).selectedId).toBeNull();
    // After AnimatePresence's exit, the panel unmounts.
    await expect(page.getByTestId("detail-panel")).toHaveCount(0);
  });

  test("close button clears the selection", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "birth");
    await expect(page.getByTestId("detail-panel")).toBeVisible();

    await page.getByLabel("关闭").click();
    await expect.poll(async () => (await readStore(page)).selectedId).toBeNull();
    await expect(page.getByTestId("detail-panel")).toHaveCount(0);
  });

  test("clicking empty canvas clears the selection", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "imperial-accession");
    await expect.poll(async () => (await readStore(page)).selectedId).toBe("imperial-accession");

    // Click the upper-left of the canvas, well clear of any item.
    const canvas = await page.locator("canvas").first().boundingBox();
    if (!canvas) throw new Error("Canvas has no bounding box");
    await page.mouse.move(canvas.x + 60, canvas.y + 60);
    await page.mouse.down();
    await page.mouse.up();

    await expect.poll(async () => (await readStore(page)).selectedId).toBeNull();
  });

  test("selecting a different item swaps the panel content in place", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    await clickDot(page, "imperial-accession");
    await expect(page.getByTestId("detail-panel")).toContainText("即皇帝位");

    await clickDot(page, "hongmen-banquet");
    await expect(page.getByTestId("detail-panel")).toContainText("鸿门宴");
  });
});
