/**
 * next-intl configuration for Historrent v1.
 *
 * v1 ships only Simplified and Traditional Chinese. English (and any
 * URL-based locale routing) is deferred to Phase 1.5+. The active locale
 * is driven by `useUiStore` and applied via `<I18nProvider>` rather than
 * URL middleware.
 */

import type { Language } from "@/state/uiStore";

export const SUPPORTED_LOCALES = ["zh-Hans", "zh-Hant"] as const satisfies readonly Language[];
export const DEFAULT_LOCALE: Language = "zh-Hans";

export type Locale = Language;
