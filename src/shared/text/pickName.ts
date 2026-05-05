import type { Language } from "@/state/uiStore";
import type { TNameVariants, TDescriptionVariants } from "@/data/liu_bang.schema";

/**
 * Given a {@link TNameVariants} and the active UI language, return the
 * script-appropriate string. Centralised so we don't sprinkle the
 * `language === 'zh-Hans' ? hans : hant` ternary across the canvas and UI.
 */
export function pickName(name: TNameVariants | TDescriptionVariants, language: Language): string {
  return language === "zh-Hans" ? name.zhHans : name.zhHant;
}
