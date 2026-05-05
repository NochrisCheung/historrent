"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { useEffect } from "react";
import { useUiStore, type Language } from "@/state/uiStore";
import zhHans from "./messages/zh-Hans.json";
import zhHant from "./messages/zh-Hant.json";

const MESSAGES: Record<Language, AbstractIntlMessages> = {
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

/**
 * Mounts `NextIntlClientProvider` around the tree, sourcing the active locale
 * from `useUiStore` so the in-app `<LanguageToggle />` flips the catalog.
 *
 * Side effect: keeps `<html lang>` in sync with the store, so:
 *  - tokens.css's `[lang="zh-Hans"]` / `[lang="zh-Hant"]` selectors swap fonts
 *  - assistive tech reads the current language correctly
 *
 * No URL-based locale routing — see implementation_plan §3.8.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useUiStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <NextIntlClientProvider locale={language} messages={MESSAGES[language]}>
      {children}
    </NextIntlClientProvider>
  );
}
