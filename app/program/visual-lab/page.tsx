import { AppShell } from "@/components/app-shell";
import { ExerciseMotionCard } from "@/components/exercise-motion-card";

export default function ProgramVisualLabPage() {
  return <AppShell>
    <div className="topline">Program Visual Lab</div>
    <h1>Exercise Visual Prototype</h1>
    <p>Current abstract SVG direction failed the recognition gate and is archived. This page is kept only as an internal record until the replacement visual format is ready.</p>
    <ExerciseMotionCard kind="MACHINE_CHEST_PRESS" />
    <ExerciseMotionCard kind="LAT_PULLDOWN" />
    <ExerciseMotionCard kind="LEG_PRESS" />
  </AppShell>;
}
