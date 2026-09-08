import Link from "next/link";

type ExerciseRef = {
  exercise_key?: string;
  display_name?: string;
};

type SuggestedExercise = ExerciseRef & {
  status?: string;
  memory_status?: string;
  evidence_count?: number;
  source_tools?: string[];
};

type Suggestion = {
  movement_slot?: string;
  current_exercises?: ExerciseRef[];
  suggested?: SuggestedExercise | null;
  alternatives?: SuggestedExercise[];
};

export type ProExerciseSuggestionPayload = {
  schema_version?: string;
  authority_rule?: string;
  suggestions?: Suggestion[];
};

function slotLabel(slot?: string) {
  const labels: Record<string, string> = {
    CHEST_FLAT: "Horizontal Press",
    HIP_HINGE: "Hip Hinge",
    QUAD_COMPOUND: "Quad Compound",
  };
  return labels[slot ?? ""] ?? slot ?? "Movement";
}

function names(items?: ExerciseRef[]) {
  return (items ?? []).map((x) => x.display_name ?? x.exercise_key).filter(Boolean).join(" · ");
}

export function ProExerciseSuggestions({ data }: { data?: ProExerciseSuggestionPayload | null }) {
  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];

  if (!suggestions.length) {
    return <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">PRO · Lab-informed Exercise Selection</div>
      <h2>ยังไม่มี Exercise Suggestion จาก LAB</h2>
      <p>เมื่อบันทึก LAB ที่เกี่ยวข้อง ระบบจะคำนวณ candidate ranking หลังบ้านและใช้เป็นจุดเริ่มต้นสำหรับการเลือกท่าใน PRO โดยยังไม่เปลี่ยน Active Program ทันที.</p>
      <div className="cta-row"><Link className="btn" href="/lab">เปิด KDKAMATO LAB</Link></div>
    </section>;
  }

  return <section className="card" style={{ marginTop: 18 }}>
    <div className="kicker">PRO · Lab-informed Exercise Selection</div>
    <h2>Exercise Suggestions</h2>
    <p>LAB ใช้จัดลำดับท่าที่ควรลองก่อนเท่านั้น เมื่อมีข้อมูลฝึกจริง Exercise Memory จะมีน้ำหนักสูงกว่า LAB.</p>
    {suggestions.map((s) => {
      const top = s.suggested;
      const current = names(s.current_exercises);
      const alternatives = names(s.alternatives);
      return <div className="exercise" key={s.movement_slot ?? top?.exercise_key}>
        <div style={{ minWidth: 0 }}>
          <strong>{slotLabel(s.movement_slot)}</strong><br/>
          <small>{current ? `ปัจจุบัน: ${current}` : "ยังไม่มีท่านี้ใน Active Program"}</small>
          {alternatives ? <p style={{ margin: "5px 0 0", fontSize: ".78rem", opacity: .72 }}>ทางเลือก: {alternatives}</p> : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>{top?.display_name ?? top?.exercise_key ?? "–"}</strong><br/>
          <small>{top?.status === "RECOMMENDED_FROM_RESPONSE" ? "Recommended from real response" : "Try & evaluate"}{top?.evidence_count ? ` · ${top.evidence_count} Lab signal${top.evidence_count > 1 ? "s" : ""}` : ""}</small>
        </div>
      </div>;
    })}
    <div className="notice" style={{ marginTop: 12 }}>ยังไม่ใช่การ auto-swap ท่าใน Program: suggestion นี้จะถูกใช้เป็น evidence ใน PRO review และ Program version ถัดไปเมื่อมีเหตุผลพอ.</div>
  </section>;
}
