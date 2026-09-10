import { AppShell } from "@/components/app-shell";
import { ExerciseVisualPair, RepDbAttribution } from "@/components/exercise-visual-pair";

const BATCH = [
  ["MACHINE_CHEST_PRESS", "Machine Chest Press"],
  ["INCLINE_DB_PRESS", "Incline Dumbbell Press"],
  ["LAT_PULLDOWN", "Lat Pulldown"],
  ["HACK_SQUAT", "Hack Squat"],
  ["LEG_PRESS", "Leg Press"],
  ["LEG_EXTENSION", "Leg Extension"],
  ["ROMANIAN_DEADLIFT", "Romanian Deadlift"],
  ["CABLE_LATERAL_RAISE", "Cable Lateral Raise"],
  ["CABLE_FACE_PULL", "Cable Face Pull"],
  ["CABLE_EXTERNAL_ROTATION", "Cable External Rotation"],
] as const;

export default function ExerciseVisualBatchPage() {
  return (
    <AppShell>
      <div className="topline">ภาพประกอบท่าฝึก · ชุดที่ 01</div>
      <h1>คลังภาพท่าฝึก RepDB</h1>
      <p>ชุดภาพที่ใช้งานใน Program ปัจจุบัน ท่าที่ค้างอยู่จะเพิ่มเมื่อผ่านการตรวจสอบความชัดเจนและเหมาะกับการใช้งานจริง</p>
      <div className="grid" style={{ marginTop: 18 }}>
        {BATCH.map(([key, label]) => (
          <section className="card" key={key}>
            <div className="kicker">{key}</div>
            <h2>{label}</h2>
            <ExerciseVisualPair exerciseKey={key} label={label} />
          </section>
        ))}
      </div>
      <RepDbAttribution />
    </AppShell>
  );
}
