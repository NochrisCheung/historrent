/**
 * Font subsetting placeholder.
 *
 * Phase 6 ships fonts via `next/font/google` (Noto Serif SC, Noto Sans SC,
 * Noto Sans TC, LXGW WenKai TC). This is a deviation from
 * implementation_plan §1.4, which specifies self-hosted WOFF2 files
 * trimmed by `pyftsubset`. The deviation is documented in §1.4.
 *
 * This script becomes meaningful when:
 *  - We want to ship LXGW WenKai (Simplified, GB18030 spec) — not on
 *    Google Fonts. Self-hosting + subsetting is the path.
 *  - Phase 11 visual finalisation locks in font choices and bundle budgets
 *    require the trimmed self-hosted route.
 *
 * For now, running this script is a no-op with a clear pointer to the
 * deferred work.
 */

function main(): void {
  console.log("subset-fonts: deferred to Phase 11 — see scripts/subset-fonts.ts header.");
  console.log("");
  console.log("When activated, this script will:");
  console.log(
    "  1. Read all unique characters from src/i18n/messages/*.json + src/data/liu_bang.json",
  );
  console.log(
    "  2. Extend with the top-3000 most-frequent Hanzi (safety net for Phase 12 curation)",
  );
  console.log("  3. Run `pyftsubset` against vendor/fonts/source/*.ttf");
  console.log("  4. Emit subsetted WOFF2 files to public/fonts/");
  console.log("  5. Wire them via `next/font/local` in src/fonts/index.ts");
}

main();
