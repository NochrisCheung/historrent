import { Timeline } from "@/components/canvas/Timeline";
import { DetailPanel } from "@/components/ui/DetailPanel";

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Timeline />
      <DetailPanel />
    </main>
  );
}
