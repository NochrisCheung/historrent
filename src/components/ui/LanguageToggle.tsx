"use client";

import { useTranslations } from "next-intl";
import { useUiStore, type Language } from "@/state/uiStore";
import styles from "./LanguageToggle.module.css";

const OPTIONS: ReadonlyArray<{ value: Language; key: "simplified" | "traditional" }> = [
  { value: "zh-Hans", key: "simplified" },
  { value: "zh-Hant", key: "traditional" },
];

/**
 * Top-right segmented toggle: 簡 / 繁. Updates `useUiStore.language`,
 * which `<I18nProvider>` propagates into next-intl and `<html lang>`.
 */
export function LanguageToggle() {
  const t = useTranslations("languageToggle");
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  return (
    <div
      className={styles.toggle}
      role="group"
      aria-label={t("ariaLabel")}
      data-testid="language-toggle"
    >
      {OPTIONS.map(({ value, key }) => (
        <button
          key={value}
          type="button"
          className={styles.option}
          aria-pressed={language === value}
          onClick={() => setLanguage(value)}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
