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
 * Pan the camera to world-x = 0 so the whole lifespan is on-screen.
 * The default framing centres on the first event (Liu Bang's birth) per
 * Option A, which puts the later events off the right edge until Phase 8
 * adds wheel/drag pan UI. For E2E coverage of all events, we move the
 * camera programmatically via the test affordance on `window`.
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
  // Wait for the resulting React re-render + drei <Html> reposition.
  // We pin the imperial-accession date label to a known x-band: with cameraX = 0,
  // its world-x ~3.85 projects to ~(canvas.width / 2 + 3.85 * canvas.width / 12)
  // ≈ 50% + 32% = 82% from canvas-left. We just wait until its rect is on-screen.
  // Wait until the date label has settled on-screen *and* its position is
  // stable across two animation frames (drei <Html> re-projects in
  // useFrame; readinging too early gives a stale rect).
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-event-date="imperial-accession"]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.left > 0 && r.right < window.innerWidth;
  });
  await page.waitForTimeout(50);
}

/**
 * Move the cursor to the centre of the dot for the event with id `eventId`.
 *
 * The dot is a WebGL primitive with no DOM of its own. We anchor off the
 * date label (`[data-event-date]`), which is rendered just below the dot in
 * screen space — empirically robust across canvas subpixel positioning.
 */
async function hoverDot(page: Page, eventId: string) {
  // R3F's pointer raycast can miss if the mouse arrives on the same frame
  // that the canvas first paints. Move once to settle, then re-read the
  // rects (drei's <Html> may have reprojected) and move again.
  //
  // The dot itself is a WebGL primitive with no DOM. We anchor between
  // the name (above) and date (below) labels: the dot's screen y is the
  // midpoint of their centres, regardless of the Phase 8.5.10 lane
  // stagger (both labels shift outward by the same lane offset).
  const settled = async () => {
    return page.evaluate((id) => {
      const name = document.querySelector(`[data-event-name="${id}"]`);
      const date = document.querySelector(`[data-event-date="${id}"]`);
      if (!name || !date) throw new Error(`No labels rendered for event "${id}"`);
      const n = name.getBoundingClientRect();
      const d = date.getBoundingClientRect();
      return {
        x: (n.left + n.right) / 2,
        y: (n.top + n.bottom + d.top + d.bottom) / 4,
      };
    }, eventId);
  };
  const first = await settled();
  await page.mouse.move(first.x, first.y);
  await page.waitForTimeout(40);
  const second = await settled();
  await page.mouse.move(second.x, second.y);
  return second;
}

async function readStore(page: Page): Promise<StoreSnapshot> {
  return page.evaluate(() => {
    const store = (window as unknown as { __historrentStore?: StoreHandle }).__historrentStore;
    if (!store) throw new Error("__historrentStore not exposed");
    return store.getState();
  });
}

/** Map a slug (used in DOM data-* attrs) to the event's UUID stored on the timeline store. */
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

test.describe("Item interaction", () => {
  test("hover sets hoveredId; moving away clears it", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    const imperialId = await eventIdFromSlug(page, "imperial-accession");
    await hoverDot(page, "imperial-accession");
    await expect.poll(async () => (await readStore(page)).hoveredId).toBe(imperialId);

    await page.mouse.move(0, 0);
    await expect.poll(async () => (await readStore(page)).hoveredId).toBeNull();
  });

  test("click sets selectedId; clicking a different item changes it", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });
    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);

    const imperialId = await eventIdFromSlug(page, "imperial-accession");
    const hongmenId = await eventIdFromSlug(page, "hongmen-banquet");

    await hoverDot(page, "imperial-accession");
    await expect.poll(async () => (await readStore(page)).hoveredId).toBe(imperialId);
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(async () => (await readStore(page)).selectedId).toBe(imperialId);

    await hoverDot(page, "hongmen-banquet");
    await expect.poll(async () => (await readStore(page)).hoveredId).toBe(hongmenId);
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(async () => (await readStore(page)).selectedId).toBe(hongmenId);
  });

  test("event names render above the dot, dates below", async ({ page }) => {
    await page.goto("/");
    await page.locator("canvas").first().waitFor({ state: "visible" });

    await expect(page.locator("[data-event-name]")).toHaveCount(5);
    await panCameraToOrigin(page);
    await expect(page.locator("[data-event-date]")).toHaveCount(5);

    await expect(page.locator('[data-event-name="imperial-accession"]')).toContainText("即皇帝位");
    await expect(page.locator('[data-event-date="imperial-accession"]')).toContainText("前202年");

    // The name DOM rect should sit above the date DOM rect for the same
    // event — verify on `birth` because it's at the viewport centre at
    // page load (Option A); other events project off-screen until Phase 8.
    const positions = await page.evaluate((id) => {
      const name = document.querySelector(`[data-event-name="${id}"]`)!.getBoundingClientRect();
      const date = document.querySelector(`[data-event-date="${id}"]`)!.getBoundingClientRect();
      return { nameTop: name.top, nameBottom: name.bottom, dateTop: date.top };
    }, "birth");
    expect(positions.nameBottom).toBeLessThan(positions.dateTop);
  });
});
