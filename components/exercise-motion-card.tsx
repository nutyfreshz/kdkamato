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
    subtitle: "ท่าดันแนวนอน · เน้นกล้ามอก",
    setup: "ปรับความสูงเบาะให้ด้ามจับอยู่ประมาณกลางอก · ให้สะบักนิ่งกับพนัก",
    move: "ดันไปข้างหน้าโดยให้ศอกเคลื่อนตามแนวด้ามจับ แล้วคุมกลับ",
    avoid: "อย่าปล่อยไหล่ลอยไปด้านหน้า หรือแอ่นหลังเพื่อช่วยดันน้ำหนัก",
  },
  LAT_PULLDOWN: {
    title: "Lat Pulldown",
    subtitle: "ท่าดึงแนวตั้ง · เน้นกล้ามหลัง",
    setup: "ล็อกต้นขาใต้แผ่นรอง · เอนลำตัวเพียงเล็กน้อย · เริ่มจากแขนเหยียด",
    move: "ดึงศอกลงข้างลำตัว ให้บาร์ลงมาบริเวณอกส่วนบน แล้วคุมกลับ",
    avoid: "อย่าเหวี่ยงลำตัว ดึงหลังคอ หรือยักไหล่ขึ้นตลอดการทำซ้ำ",
  },
  LEG_PRESS: {
    title: "45° Leg Press",
    subtitle: "ท่าดันที่ใช้เข่าเด่น · เน้นต้นขาด้านหน้าและก้น",
    setup: "ให้หลังและเชิงกรานสัมผัสพนัก · วางเท้าให้เข่าเคลื่อนตามแนวปลายเท้า",
    move: "ลงลึกเท่าที่เชิงกรานยังนิ่ง แล้วดันแผ่นกลับโดยไม่ล็อกเข่ากระแทก",
    avoid: "อย่าให้ก้นม้วนลอยจากพนัก เข่าพับเข้าด้านใน หรือปล่อยแผ่นลงเร็ว",
  },
};

function FailedPrototypeNotice({ title }: { title: string }) {
  return <article className={styles.motionCard}>
    <div className={styles.motionHeader}>
      <div><div className="kicker">ต้นแบบที่เก็บไว้เป็นบันทึก</div><h2>{title}</h2><p>ภาพ SVG แบบนามธรรมไม่ผ่านเกณฑ์ด้านการจดจำ จึงไม่ถูกนำไปใช้จริง</p></div>
      <span className={styles.motionBadge}>ไม่ผ่านเกณฑ์</span>
    </div>
    <div className="notice warning">แนวทางภาพถัดไป: ต้องเห็นคนและอุปกรณ์ชัดเจน พร้อมแยกภาพท่าเริ่มต้นและท่าสิ้นสุด ไม่ใช้ภาพเคลื่อนไหวแบบคนเส้นนามธรรม</div>
  </article>;
}

export function ExerciseMotionCard({ kind }: { kind: MotionKind }) {
  return <FailedPrototypeNotice title={SPECS[kind].title} />;
}
