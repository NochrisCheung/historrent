"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useTimelineStore } from "@/state/timelineStore";
import { findEvent } from "@/data/liu_bang";
import { formatFuzzyDate } from "@/shared/date/formatFuzzyDate";
import { formatCitation } from "@/shared/citation/format";
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
 * Phase 1 displays only Simplified Chinese — Phase 6 wires the language
 * toggle through `uiStore` and switches the rendered fields.
 */
export function DetailPanel() {
  const selectedId = useTimelineStore((s) => s.selectedId);
  const setSelected = useTimelineStore((s) => s.setSelected);
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
          <PanelContent event={event} onClose={() => setSelected(null)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PanelContent({ event, onClose }: { event: TLiuBangEvent; onClose: () => void }) {
  return (
    <>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{event.name.zhHans}</h2>
          <p className={styles.date}>{formatFuzzyDate(event.date, "zh-Hans")}</p>
        </div>
        <button type="button" className={styles.close} aria-label="关闭" onClick={onClose}>
          ×
        </button>
      </header>

      <p className={styles.description}>{event.description.zhHans}</p>

      <section className={styles.citations} aria-labelledby="citations-heading">
        <h3 id="citations-heading" className={styles.citationsHeading}>
          来源
        </h3>
        {event.citations.map((citation, index) => (
          <CitationCard key={index} citation={citation} />
        ))}
      </section>

      <button
        type="button"
        className={styles.synthesisStub}
        aria-disabled
        disabled
        title="Phase 9 wires DeepSeek source synthesis"
      >
        显示综合 (Phase 9)
      </button>
    </>
  );
}

function CitationCard({ citation }: { citation: TCitation }) {
  const f = formatCitation(citation, "zh-Hans");
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
