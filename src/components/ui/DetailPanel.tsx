"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useTimelineStore } from "@/state/timelineStore";
import { useUiStore, type Language } from "@/state/uiStore";
import { findEvent } from "@/data/liu_bang";
import { formatFuzzyDate } from "@/shared/date/formatFuzzyDate";
import { formatCitation } from "@/shared/citation/format";
import { pickName } from "@/shared/text/pickName";
import { synthesise, SynthesisRequestError, type SynthesisResult } from "@/ai/client/client";
import type { TCitation, TLiuBangEvent } from "@/data/liu_bang.schema";
import styles from "./DetailPanel.module.css";

const SLIDE_DURATION = 0.24; // matches --dur-base in tokens.css
const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * `id` attribute applied to each citation card, so that synthesis chips
 * (rendered as `<button>` inside the synthesis paragraph) can find them
 * with `document.getElementById` and call `scrollIntoView`.
 */
function citationCardId(chapter: number, paragraph: number): string {
  return `citation-Shiji-${chapter}-${paragraph}`;
}

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

      <SynthesisSection key={`${event.id}|${language}`} event={event} language={language} />
    </>
  );
}

function CitationCard({ citation, language }: { citation: TCitation; language: Language }) {
  const f = formatCitation(citation, language);
  return (
    <article
      className={styles.citationCard}
      id={citationCardId(citation.chapter, citation.paragraph)}
    >
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

type SynthesisState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; result: SynthesisResult };

/**
 * "Show synthesis" affordance. Idle → on click, POSTs to `/api/synthesise`;
 * shows a loading dot; on success renders the synthesis with `[Shiji-N-M]`
 * chips that scroll the matching citation card into view. On error shows
 * inline retry.
 *
 * Each (event, language) pair has its own state — switching either resets.
 */
function SynthesisSection({ event, language }: { event: TLiuBangEvent; language: Language }) {
  const t = useTranslations("panel");
  // Reset is handled by the parent passing a fresh `key` per
  // (event, language) — React unmounts and remounts this component, so
  // local state begins fresh without an in-render or in-effect setState.
  const [state, setState] = useState<SynthesisState>({ kind: "idle" });

  async function run() {
    setState({ kind: "loading" });
    try {
      const result = await synthesise(event.id, language);
      setState({ kind: "ready", result });
    } catch (err) {
      const message =
        err instanceof SynthesisRequestError
          ? `${t("synthesisError")} (HTTP ${err.status})`
          : t("synthesisError");
      setState({ kind: "error", message });
    }
  }

  return (
    <section className={styles.synthesis} aria-labelledby="synthesis-heading">
      <h3 id="synthesis-heading" className={styles.synthesisHeading}>
        {t("synthesis")}
      </h3>

      {state.kind === "idle" && (
        <button
          type="button"
          className={styles.synthesisButton}
          onClick={run}
          data-testid="synthesis-show"
        >
          {t("showSynthesis")}
        </button>
      )}

      {state.kind === "loading" && (
        <p className={styles.synthesisStatus} data-testid="synthesis-loading">
          <span className={styles.synthesisDot} aria-hidden /> {t("synthesising")}
        </p>
      )}

      {state.kind === "error" && (
        <div className={styles.synthesisError} data-testid="synthesis-error">
          <p>{state.message}</p>
          <button type="button" className={styles.synthesisButton} onClick={run}>
            {t("synthesisRetry")}
          </button>
        </div>
      )}

      {state.kind === "ready" && (
        <SynthesisBody result={state.result} cachedHint={t("synthesisCachedHint")} />
      )}
    </section>
  );
}

/**
 * Renders the synthesis paragraph with inline `[Shiji-N-M]` chips. Each
 * chip is a `<button>` that scrolls the matching citation card (above)
 * into view when clicked.
 */
function SynthesisBody({ result, cachedHint }: { result: SynthesisResult; cachedHint: string }) {
  const segments = parseSynthesisChips(result.synthesis);
  return (
    <div data-testid="synthesis-ready">
      <p className={styles.synthesisText}>
        {segments.map((seg, i) =>
          seg.kind === "text" ? (
            <span key={i}>{seg.text}</span>
          ) : (
            <button
              key={i}
              type="button"
              className={styles.synthesisChip}
              data-testid="synthesis-chip"
              data-chip-label={seg.label}
              onClick={() => scrollToCitation(seg.chapter, seg.paragraph)}
            >
              {seg.label}
            </button>
          ),
        )}
      </p>
      {result.cached && <p className={styles.synthesisCached}>{cachedHint}</p>}
    </div>
  );
}

type SynthesisSegment =
  | { kind: "text"; text: string }
  | { kind: "chip"; label: string; chapter: number; paragraph: number };

const CHIP_REGEX = /\[Shiji-(\d+)-(\d+)\]/g;

/**
 * Split the model's synthesis on `[Shiji-N-M]` chip boundaries. Returns
 * an alternating sequence of text segments and chips, suitable for
 * direct render.
 */
export function parseSynthesisChips(text: string): SynthesisSegment[] {
  const segments: SynthesisSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(CHIP_REGEX)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ kind: "text", text: text.slice(lastIndex, start) });
    }
    const chapter = Number.parseInt(match[1] ?? "0", 10);
    const paragraph = Number.parseInt(match[2] ?? "0", 10);
    segments.push({
      kind: "chip",
      label: `Shiji-${chapter}-${paragraph}`,
      chapter,
      paragraph,
    });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segments;
}

function scrollToCitation(chapter: number, paragraph: number) {
  const id = citationCardId(chapter, paragraph);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(styles.citationFlash ?? "");
    setTimeout(() => el.classList.remove(styles.citationFlash ?? ""), 800);
  }
}
