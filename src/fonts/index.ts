/**
 * Font registration via `next/font/google`.
 *
 * Phase 6 deviation from implementation_plan §1.4: the plan specifies
 * `next/font/local` + a manual `pyftsubset` step. For the v1 launch (no
 * users, small corpus, visual fidelity to be locked in Phase 11) we use
 * `next/font/google` and accept the bundle cost. Phase 11 will revisit:
 * if Google's CDN-loaded subsets aren't sharp enough or the bundle is too
 * heavy, we'll switch to self-hosted, pyftsubset-trimmed WOFF2 files.
 *
 * Mapping (applied via `[lang=...]` selectors in tokens.css):
 *   --font-content   ← LXGW WenKai TC for Hant; Noto Serif SC for Hans
 *                       (LXGW WenKai SC isn't on Google Fonts; Noto Serif
 *                       SC is the closest available editorial serif)
 *   --font-chrome    ← Noto Sans SC / Noto Sans TC, language-aware
 */

import { LXGW_WenKai_TC, Noto_Sans_SC, Noto_Sans_TC, Noto_Serif_SC } from "next/font/google";

export const lxgwWenkaiTc = LXGW_WenKai_TC({
  variable: "--font-lxgw-wenkai-tc",
  weight: ["300", "400", "700"],
  display: "swap",
  preload: false,
});

export const notoSerifSc = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["300", "400", "700"],
  display: "swap",
  preload: false,
});

export const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["300", "400", "500"],
  display: "swap",
  preload: false,
});

export const notoSansTc = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["300", "400", "500"],
  display: "swap",
  preload: false,
});

/** All four classNames joined — apply to `<html>` to expose the CSS vars. */
export const fontVariableClasses = [
  lxgwWenkaiTc.variable,
  notoSerifSc.variable,
  notoSansSc.variable,
  notoSansTc.variable,
].join(" ");
