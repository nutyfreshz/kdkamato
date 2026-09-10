import { getExerciseVisual } from "@/lib/exercise-visuals";

export function ExerciseVisualPair({ exerciseKey, label }: { exerciseKey: string; label: string }) {
  const visual = getExerciseVisual(exerciseKey);
  if (!visual) return null;

  const frameStyle = {
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(255,255,255,.035)",
  } as const;

  const imageStyle = {
    display: "block",
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    background: "#f5f5f5",
  } as const;

  return (
    <div style={{ marginTop: 10, maxWidth: 360 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <div style={frameStyle}>
          <div style={{ padding: "6px 8px", fontSize: ".68rem", letterSpacing: ".08em", opacity: .68 }}>เริ่ม</div>
          <img src={visual.start} alt={`${label} ท่าเริ่มต้น`} loading="lazy" style={imageStyle} />
        </div>
        <div style={frameStyle}>
          <div style={{ padding: "6px 8px", fontSize: ".68rem", letterSpacing: ".08em", opacity: .68 }}>สิ้นสุด</div>
          <img src={visual.finish} alt={`${label} ท่าสิ้นสุด`} loading="lazy" style={imageStyle} />
        </div>
      </div>
    </div>
  );
}

export function RepDbAttribution() {
  return (
    <p style={{ marginTop: 16, fontSize: ".72rem", opacity: .58 }}>
      ข้อมูลท่าฝึกจาก <a href="https://repdb.co" target="_blank" rel="noreferrer">RepDB</a>
    </p>
  );
}
