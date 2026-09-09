"use client";

import { useMemo, useState } from "react";
import { ExerciseFeedbackForm } from "@/components/exercise-feedback-form";

type ProgramItem = {
  item_id: string;
  training_day: number;
  display_order: number;
  exercise_key: string;
  metadata: { display_name?: string; day_label?: string; target_label?: string } | null;
};

type FeedbackRow = {
  exercise_key: string;
  performance_status: string | null;
  tolerance_status: string | null;
  recovery_status: string | null;
  preference_status: string | null;
  optional_note: string | null;
};

function hasFeedback(row?: FeedbackRow | null) {
  return Boolean(
    row?.performance_status ||
    row?.tolerance_status ||
    row?.recovery_status ||
    row?.preference_status ||
    row?.optional_note,
  );
}

export function PhysicalConsultProgramAccordion({
  items,
  feedback,
}: {
  items: ProgramItem[];
  feedback: FeedbackRow[];
}) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const feedbackMap = useMemo(() => new Map(feedback.map((x) => [x.exercise_key, x])), [feedback]);
  const days = useMemo(() => {
    const grouped = new Map<number, ProgramItem[]>();
    for (const item of items) {
      const list = grouped.get(item.training_day) ?? [];
      list.push(item);
      grouped.set(item.training_day, list);
    }
    return Array.from(grouped.entries());
  }, [items]);

  return <>
    {days.map(([day, dayItems]) => <section className="card day" key={day} style={{ marginTop: 18 }}>
      <div className="kicker">DAY {day}</div>
      <h2>{dayItems[0]?.metadata?.day_label ?? `Day ${day}`}</h2>
      <p style={{ marginTop: -4, opacity: .72, fontSize: ".86rem" }}>แตะท่าที่กำลังทดสอบ · เปิดได้ทีละ 1 ท่า</p>

      {dayItems.map((item) => {
        const label = item.metadata?.display_name ?? item.exercise_key;
        const initial = feedbackMap.get(item.exercise_key) ?? null;
        const isOpen = openItemId === item.item_id;
        const done = hasFeedback(initial);

        return <div key={item.item_id} style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10, marginTop: 10 }}>
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setOpenItemId(isOpen ? null : item.item_id)}
            style={{
              width: "100%",
              padding: "10px 0",
              border: 0,
              background: "transparent",
              color: "inherit",
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: "block" }}>{label}</strong>
              <small>{item.metadata?.target_label ?? "Training movement"}</small>
            </span>
            <span style={{ flexShrink: 0, textAlign: "right" }}>
              {done && <small style={{ display: "block", marginBottom: 2 }}>บันทึกวันนี้แล้ว</small>}
              <strong aria-hidden="true">{isOpen ? "−" : "+"}</strong>
            </span>
          </button>

          <div hidden={!isOpen}>
            <ExerciseFeedbackForm exerciseKey={item.exercise_key} label={label} initial={initial} />
          </div>
        </div>;
      })}
    </section>)}
  </>;
}
