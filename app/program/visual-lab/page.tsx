import { AppShell } from "@/components/app-shell";
import { ExerciseMotionCard } from "@/components/exercise-motion-card";

export default function ProgramVisualLabPage() {
  return <AppShell>
    <div className="topline">Program Visual Lab</div>
    <h1>ต้นแบบภาพประกอบท่าฝึก</h1>
    <p>ต้นแบบ SVG แบบนามธรรมไม่ผ่านเกณฑ์ด้านการจดจำท่าฝึก จึงไม่ถูกนำไปใช้จริง หน้านี้เก็บไว้เป็นบันทึกภายในจนกว่ารูปแบบภาพทดแทนจะพร้อม</p>
    <ExerciseMotionCard kind="MACHINE_CHEST_PRESS" />
    <ExerciseMotionCard kind="LAT_PULLDOWN" />
    <ExerciseMotionCard kind="LEG_PRESS" />
  </AppShell>;
}
