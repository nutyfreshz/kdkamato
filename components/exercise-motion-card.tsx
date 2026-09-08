import styles from "./program-app.module.css";

type MotionKind = "MACHINE_CHEST_PRESS" | "LAT_PULLDOWN" | "LEG_PRESS";

type Spec = {
  title: string;
  subtitle: string;
  setup: string;
  move: string;
  avoid: string;
};

const SPECS: Record<MotionKind, Spec> = {
  MACHINE_CHEST_PRESS: {
    title: "Machine Chest Press",
    subtitle: "Horizontal press · chest dominant",
    setup: "Seat heightให้ handle อยู่ประมาณ mid-chest · สะบักนิ่งกับพนัก",
    move: "กดไปข้างหน้าโดยให้ศอกเดินตามแนว handle แล้วคุมกลับ",
    avoid: "ไหล่ลอยไปด้านหน้า · หลังแอ่นเพื่อไล่น้ำหนัก",
  },
  LAT_PULLDOWN: {
    title: "Lat Pulldown",
    subtitle: "Vertical pull · lat dominant",
    setup: "ล็อกต้นขาใต้ pad · ลำตัวเอนเพียงเล็กน้อย · เริ่มจากแขนยาว",
    move: "ดึงศอกลงข้างลำตัว ให้ bar ลงสู่ช่วง upper-chest แล้วคุมกลับ",
    avoid: "เหวี่ยงลำตัว · ดึงหลังคอ · ยักไหล่ขึ้นตลอด rep",
  },
  LEG_PRESS: {
    title: "45° Leg Press",
    subtitle: "Knee-dominant press · quads/glutes",
    setup: "หลังและเชิงกรานสัมผัสพนัก · วางเท้าให้เข่าเดินตามแนวปลายเท้า",
    move: "ลงลึกเท่าที่เชิงกรานยังนิ่ง แล้วดัน platform กลับโดยไม่ล็อกเข่ากระแทก",
    avoid: "ก้นม้วนลอยจากพนัก · เข่าพับเข้าด้านใน · ปล่อย sled ลงเร็ว",
  },
};

function FailedPrototypeNotice({ title }: { title: string }) {
  return <article className={styles.motionCard}>
    <div className={styles.motionHeader}>
      <div><div className="kicker">Prototype archived</div><h2>{title}</h2><p>SVG abstraction failed the recognition gate and will not ship.</p></div>
      <span className={styles.motionBadge}>FAILED GATE</span>
    </div>
    <div className="notice warning">Next visual direction: recognizable human + recognizable equipment + separate START / FINISH frames. No abstract stick-figure motion diagram.</div>
  </article>;
}

export function ExerciseMotionCard({ kind }: { kind: MotionKind }) {
  return <FailedPrototypeNotice title={SPECS[kind].title} />;
}
