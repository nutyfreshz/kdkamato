import { ExerciseMotionCard } from "@/components/exercise-motion-card";

export default function ExerciseVisualReviewPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080b0d", color: "#f5f7f8", padding: "32px clamp(16px, 4vw, 48px) 80px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ color: "#ff6b1a", fontSize: ".75rem", letterSpacing: ".14em", fontWeight: 800, textTransform: "uppercase", marginBottom: 12 }}>
          KDKAMATO · Exercise Visual Review
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: "clamp(2rem,5vw,3.8rem)", lineHeight: 1 }}>Motion Card Prototype</h1>
        <p style={{ color: "#9aa7af", marginBottom: 24 }}>หน้านี้เป็น public review route ชั่วคราวเพื่อให้ตรวจ SVG/vector จริงโดยไม่ติด auth หรือ Program routing.</p>
        <ExerciseMotionCard kind="MACHINE_CHEST_PRESS" />
        <ExerciseMotionCard kind="LAT_PULLDOWN" />
        <ExerciseMotionCard kind="LEG_PRESS" />
      </div>
    </main>
  );
}
