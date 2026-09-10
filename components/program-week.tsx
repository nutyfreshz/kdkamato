import styles from "./program-app.module.css";

type WeekSlot = { day: string; trainingDay?: number; rest?: boolean };

function weekLayout(days: number, focus: string): WeekSlot[] {
  if (days === 2) return [
    { day: "จ.", trainingDay: 1 }, { day: "อ.", rest: true }, { day: "พ.", rest: true },
    { day: "พฤ.", trainingDay: 2 }, { day: "ศ.", rest: true }, { day: "ส.", rest: true }, { day: "อา.", rest: true },
  ];
  if (days === 3) return [
    { day: "จ.", trainingDay: 1 }, { day: "อ.", rest: true }, { day: "พ.", trainingDay: 2 },
    { day: "พฤ.", rest: true }, { day: "ศ.", trainingDay: 3 }, { day: "ส.", rest: true }, { day: "อา.", rest: true },
  ];
  if (days === 4) return [
    { day: "จ.", trainingDay: 1 }, { day: "อ.", trainingDay: 2 }, { day: "พ.", rest: true },
    { day: "พฤ.", trainingDay: 3 }, { day: "ศ.", trainingDay: 4 }, { day: "ส.", rest: true }, { day: "อา.", rest: true },
  ];
  if (days === 5 && focus === "LEGS") return [
    { day: "จ.", trainingDay: 1 }, { day: "อ.", trainingDay: 2 }, { day: "พ.", rest: true },
    { day: "พฤ.", trainingDay: 3 }, { day: "ศ.", trainingDay: 5 }, { day: "ส.", rest: true }, { day: "อา.", trainingDay: 4 },
  ];
  if (days === 5) return [
    { day: "จ.", trainingDay: 1 }, { day: "อ.", trainingDay: 2 }, { day: "พ.", rest: true },
    { day: "พฤ.", trainingDay: 3 }, { day: "ศ.", trainingDay: 4 }, { day: "ส.", trainingDay: 5 }, { day: "อา.", rest: true },
  ];
  return [
    { day: "จ.", trainingDay: 1 }, { day: "อ.", trainingDay: 2 }, { day: "พ.", trainingDay: 3 },
    { day: "พฤ.", rest: true }, { day: "ศ.", trainingDay: 4 }, { day: "ส.", trainingDay: 5 }, { day: "อา.", trainingDay: 6 },
  ];
}

export function ProgramWeek({
  days,
  focus,
  dayLabels,
}: {
  days: number;
  focus: string;
  dayLabels: Record<number, string>;
}) {
  const week = weekLayout(days, focus);
  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ตารางฝึกแนะนำต่อสัปดาห์</div>
      <h2>ปฏิทินวันฝึก/วันพัก</h2>
      <div className={styles.weekGrid}>
        {week.map((slot) => (
          <div key={slot.day} className={`${styles.weekCell} ${slot.rest ? styles.weekRest : styles.weekTrain}`}>
            <strong>{slot.day}</strong>
            <span>{slot.rest ? "พัก" : dayLabels[slot.trainingDay ?? 0] ?? `วันที่ฝึก ${slot.trainingDay}`}</span>
          </div>
        ))}
      </div>
      <p className={styles.weekNote}>นี่คือตารางพักเริ่มต้น คุณสามารถขยับวันตามชีวิตจริงได้ แต่ควรเว้นวันพักให้ใกล้เคียงเดิม โดยเฉพาะรอบกล้ามเนื้อที่เป็นจุดเน้น</p>
    </section>
  );
}
