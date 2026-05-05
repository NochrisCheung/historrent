import { Timeline } from "@/components/canvas/Timeline";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { IntervalLegend } from "@/components/ui/IntervalLegend";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ZoomToggle } from "@/components/ui/ZoomToggle";
import { CurveTuner } from "@/components/canvas/CurveTuner";

const isDev = process.env.NODE_ENV === "development";
// Playwright's webServer sets this to "1" so the Leva panel doesn't intercept
// clicks on the language toggle and detail panel during E2E.
const tunerSuppressed = process.env.NEXT_PUBLIC_DISABLE_DEV_TUNER === "1";
const showTuner = isDev && !tunerSuppressed;

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Timeline />
      <LanguageToggle />
      <ZoomToggle />
      <IntervalLegend />
      <DetailPanel />
      {showTuner && <CurveTuner />}
    </main>
  );
}
