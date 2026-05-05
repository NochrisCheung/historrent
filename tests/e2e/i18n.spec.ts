import { test, expect, type Page } from "@playwright/test";

type StoreSnapshot = { language: "zh-Hans" | "zh-Hant" };
type StoreHandle = { getState: () => StoreSnapshot };

async function readUiStore(page: Page): Promise<StoreSnapshot> {
  return page.evaluate(() => {
    const store = (window as unknown as { __historrentUiStore?: StoreHandle }).__historrentUiStore;
    if (!store) throw new Error("__historrentUiStore not exposed");
    return store.getState();
  });
}

async function hoverDot(page: Page, eventId: string) {
  const target = await page.evaluate((id) => {
    const label = document.querySelector(`[data-event-label="${id}"]`);
    if (!label) throw new Error(`No label rendered for event "${id}"`);
    const r = label.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top - 10 };
  }, eventId);
  await page.mouse.move(target.x, target.y);
}

async function clickDot(page: Page, eventId: string) {
  await hoverDot(page, eventId);
  await page.mouse.down();
  await page.mouse.up();
}

test.describe("Language toggle", () => {
  test("default is Simplified (zh-Hans)", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    expect((await readUiStore(page)).language).toBe("zh-Hans");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
    // Simplified label for "imperial accession": 即皇帝位 (same in both scripts; check sibling)
    await expect(page.locator('[data-event-label="enter-xianyang"]')).toContainText("攻入咸阳");
  });

  test("clicking 繁 swaps event labels and html lang", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    await page.getByTestId("language-toggle").getByRole("button", { name: "繁" }).click();
    await expect.poll(async () => (await readUiStore(page)).language).toBe("zh-Hant");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
    await expect(page.locator('[data-event-label="enter-xianyang"]')).toContainText("攻入咸陽");
  });

  test("toggle propagates into the detail panel (UI strings + event name)", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    await clickDot(page, "enter-xianyang");
    const panel = page.getByTestId("detail-panel");
    await expect(panel).toBeVisible();
    // Hans default
    await expect(panel.getByLabel("关闭")).toBeVisible();
    await expect(panel).toContainText("攻入咸阳");
    await expect(panel).toContainText("来源");

    // Switch to Traditional
    await page.getByTestId("language-toggle").getByRole("button", { name: "繁" }).click();
    await expect(panel.getByLabel("關閉")).toBeVisible();
    await expect(panel).toContainText("攻入咸陽");
    await expect(panel).toContainText("來源");
  });

  test("citation link rewrites to /zhs in Hans, /zh in Hant", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    await clickDot(page, "imperial-accession");
    const panel = page.getByTestId("detail-panel");
    await expect(panel.locator('a[href*="ctext.org/shiji/gao-zu-ben-ji/zhs#n"]')).toHaveCount(1);

    await page.getByTestId("language-toggle").getByRole("button", { name: "繁" }).click();
    await expect(panel.locator('a[href*="ctext.org/shiji/gao-zu-ben-ji/zh#n"]')).toHaveCount(1);
    await expect(panel.locator('a[href*="ctext.org/shiji/gao-zu-ben-ji/zhs#n"]')).toHaveCount(0);
  });

  test("language preference persists across reload via sessionStorage", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-label]")).toHaveCount(5);

    await page.getByTestId("language-toggle").getByRole("button", { name: "繁" }).click();
    await expect.poll(async () => (await readUiStore(page)).language).toBe("zh-Hant");

    await page.reload();
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect.poll(async () => (await readUiStore(page)).language).toBe("zh-Hant");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  });
});
