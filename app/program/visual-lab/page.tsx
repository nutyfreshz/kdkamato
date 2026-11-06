import { AppShell } from "@/components/app-shell";
import { ExerciseMotionCard } from "@/components/exercise-motion-card";

export default function ProgramVisualLabPage() {
  return <AppShell>
    <div className="topline">Program Visual Lab</div>
    <h1>ต้นแบบภาพประกอบท่าฝึก</h1>
    <p>ภาพ SVG ชุดนี้ยังสื่อท่าฝึกได้ไม่ชัด จึงเก็บเป็นต้นแบบภายในจนกว่าภาพชุดใหม่จะพร้อม</p>
    <ExerciseMotionCard kind="MACHINE_CHEST_PRESS" />
    <ExerciseMotionCard kind="LAT_PULLDOWN" />
    <ExerciseMotionCard kind="LEG_PRESS" />
  </AppShell>;
}
