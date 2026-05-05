"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useTimelineStore } from "@/state/timelineStore";
import { useUiStore, type Language } from "@/state/uiStore";
import { findEvent } from "@/data/liu_bang";
import { formatFuzzyDate } from "@/shared/date/formatFuzzyDate";
import { formatCitation } from "@/shared/citation/format";
import { pickName } from "@/shared/text/pickName";
import type { TCitation, TLiuBangEvent } from "@/data/liu_bang.schema";
import styles from "./DetailPanel.module.css";

const SLIDE_DURATION = 0.24; // matches --dur-base in tokens.css
const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * Slides in from the right when an event is selected. Clears selection on:
 *  - the close button,
 *  - the ESC key,
 *  - clicking on empty canvas (handled in Timeline.tsx via onPointerMissed).
 *
 * All user-facing strings flow through next-intl. Event names, descriptions,
 * the formatted date, and the citation card all switch to the active
 * Hans/Hant variant when the language toggle flips.
 */
export function DetailPanel() {
  const selectedId = useTimelineStore((s) => s.selectedId);
  const setSelected = useTimelineStore((s) => s.setSelected);
  const language = useUiStore((s) => s.language);
  const event = findEvent(selectedId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setSelected]);

  return (
    <AnimatePresence>
      {event && (
        <motion.aside
          key="detail-panel"
          className={styles.panel}
          data-testid="detail-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: SLIDE_DURATION, ease: EASE }}
        >
          <PanelContent event={event} language={language} onClose={() => setSelected(null)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelContent({
  event,
  language,
  onClose,
}: {
  event: TLiuBangEvent;
  language: Language;
  onClose: () => void;
}) {
  const t = useTranslations("panel");

  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{pickName(event.name, language)}</h2>
          <p className={styles.date}>{formatFuzzyDate(event.date, language)}</p>
        </div>
        <button type="button" className={styles.close} aria-label={t("close")} onClick={onClose}>
          ×
        </button>
      </header>

      <p className={styles.description}>{pickName(event.description, language)}</p>

      <section className={styles.citations} aria-labelledby="citations-heading">
        <h3 id="citations-heading" className={styles.citationsHeading}>
          {t("citations")}
        </h3>
        {event.citations.map((citation, index) => (
          <CitationCard key={index} citation={citation} language={language} />
        ))}
      </section>

      <button
        type="button"
        className={styles.synthesisStub}
        aria-disabled
        disabled
        title={t("synthesisDeferredHint")}
      >
        {t("showSynthesisDeferred")}
      </button>
    </>
  );
}

function CitationCard({ citation, language }: { citation: TCitation; language: Language }) {
  const f = formatCitation(citation, language);
  return (
    <article className={styles.citationCard}>
      <a href={f.href} target="_blank" rel="noopener noreferrer" className={styles.citationLink}>
        <span className={styles.citationLabel}>{f.label}</span>
        <span className={styles.citationAnchor}>「{f.textAnchor}」</span>
        <span className={styles.citationExternal} aria-hidden>
          ↗
        </span>
      </a>
      <p className={styles.citationEdition}>{f.edition}</p>
    </article>
  );
}
