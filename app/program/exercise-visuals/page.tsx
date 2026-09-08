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
      <div className="topline">Exercise Visuals · Batch 01</div>
      <h1>RepDB Base Library</h1>
      <p>First production batch. Remaining catalog gaps are intentionally deferred until the PRO version passes validation.</p>
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
