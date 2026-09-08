import { AppShell } from "@/components/app-shell";
import { ExerciseMotionCard } from "@/components/exercise-motion-card";

export default function ProgramVisualLabPage() {
  return <AppShell>
    <div className="topline">Program Visual Lab</div>
    <h1>Exercise Motion Card Prototype</h1>
    <p>Internal visual gate only. ยังไม่ผูกเข้ากับ exercise list จริงจนกว่าจะผ่าน quality review.</p>
    <ExerciseMotionCard kind="MACHINE_CHEST_PRESS" />
    <ExerciseMotionCard kind="LAT_PULLDOWN" />
    <ExerciseMotionCard kind="LEG_PRESS" />
  </AppShell>;
}
