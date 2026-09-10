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
      <h2>ยังไม่มีคำแนะนำท่าฝึกจาก LAB</h2>
      <p>เมื่อบันทึก LAB ที่เกี่ยวข้อง ระบบจะช่วยจัดลำดับว่าท่าไหนควรลองก่อน โดยยังไม่เปลี่ยน Program ทันที</p>
      <div className="cta-row"><Link className="btn" href="/lab">เปิด KDKAMATO LAB</Link></div>
    </section>;
  }

  return <section className="card" style={{ marginTop: 18 }}>
    <div className="kicker">PRO · Lab-informed Exercise Selection</div>
    <h2>คำแนะนำท่าฝึก</h2>
    <p>LAB ช่วยเลือกว่าควรลองท่าไหนก่อน แต่เมื่อคุณลองจริงแล้ว Exercise Memory จะให้ความสำคัญกับผลการฝึกของคุณมากกว่า</p>
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
          <small>{top?.status === "RECOMMENDED_FROM_RESPONSE" ? "แนะนำจากผลการฝึกจริง" : "ควรลองต่อ"}{top?.evidence_count ? ` · ข้อมูล LAB ${top.evidence_count} กลุ่ม` : ""}</small>
        </div>
      </div>;
    })}
    <div className="notice" style={{ marginTop: 12 }}>คำแนะนำนี้ยังไม่เปลี่ยน Program โดยอัตโนมัติ และจะถูกนำไปใช้ประกอบการทบทวนครั้งถัดไป</div>
  </section>;
}
