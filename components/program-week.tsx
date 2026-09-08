import styles from "./program-app.module.css";

type WeekSlot = { day: string; trainingDay?: number; rest?: boolean };

function weekLayout(days: number, focus: string): WeekSlot[] {
  if (days === 2) return [
    { day: "Mon", trainingDay: 1 }, { day: "Tue", rest: true }, { day: "Wed", rest: true },
    { day: "Thu", trainingDay: 2 }, { day: "Fri", rest: true }, { day: "Sat", rest: true }, { day: "Sun", rest: true },
  ];
  if (days === 3) return [
    { day: "Mon", trainingDay: 1 }, { day: "Tue", rest: true }, { day: "Wed", trainingDay: 2 },
    { day: "Thu", rest: true }, { day: "Fri", trainingDay: 3 }, { day: "Sat", rest: true }, { day: "Sun", rest: true },
  ];
  if (days === 4) return [
    { day: "Mon", trainingDay: 1 }, { day: "Tue", trainingDay: 2 }, { day: "Wed", rest: true },
    { day: "Thu", trainingDay: 3 }, { day: "Fri", trainingDay: 4 }, { day: "Sat", rest: true }, { day: "Sun", rest: true },
  ];
  if (days === 5 && focus === "LEGS") return [
    { day: "Mon", trainingDay: 1 }, { day: "Tue", trainingDay: 2 }, { day: "Wed", rest: true },
    { day: "Thu", trainingDay: 3 }, { day: "Fri", trainingDay: 5 }, { day: "Sat", rest: true }, { day: "Sun", trainingDay: 4 },
  ];
  if (days === 5) return [
    { day: "Mon", trainingDay: 1 }, { day: "Tue", trainingDay: 2 }, { day: "Wed", rest: true },
    { day: "Thu", trainingDay: 3 }, { day: "Fri", trainingDay: 4 }, { day: "Sat", trainingDay: 5 }, { day: "Sun", rest: true },
  ];
  return [
    { day: "Mon", trainingDay: 1 }, { day: "Tue", trainingDay: 2 }, { day: "Wed", trainingDay: 3 },
    { day: "Thu", rest: true }, { day: "Fri", trainingDay: 4 }, { day: "Sat", trainingDay: 5 }, { day: "Sun", trainingDay: 6 },
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
      <div className="kicker">Recommended weekly layout</div>
      <h2>Train / Rest Calendar</h2>
      <div className={styles.weekGrid}>
        {week.map((slot) => (
          <div key={slot.day} className={`${styles.weekCell} ${slot.rest ? styles.weekRest : styles.weekTrain}`}>
            <strong>{slot.day}</strong>
            <span>{slot.rest ? "REST" : dayLabels[slot.trainingDay ?? 0] ?? `Day ${slot.trainingDay}`}</span>
          </div>
        ))}
      </div>
      <p className={styles.weekNote}>Default recovery layout. ขยับวันได้ตามชีวิตจริง แต่ควรรักษาช่องว่าง Rest ใกล้เคียงเดิม โดยเฉพาะรอบ Focus muscle.</p>
    </section>
  );
}
