"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

type InitialFeedback = {
  performance_status?: string | null;
  tolerance_status?: string | null;
  recovery_status?: string | null;
  preference_status?: string | null;
  optional_note?: string | null;
};

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "บันทึกไม่สำเร็จ");
  }
  return "บันทึกไม่สำเร็จ";
}

export function ExerciseFeedbackForm({
  exerciseKey,
  label,
  initial,
}: {
  exerciseKey: string;
  label: string;
  initial?: InitialFeedback | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [performance, setPerformance] = useState(initial?.performance_status ?? "");
  const [tolerance, setTolerance] = useState(initial?.tolerance_status ?? "");
  const [recovery, setRecovery] = useState(initial?.recovery_status ?? "");
  const [preference, setPreference] = useState(initial?.preference_status ?? "");
  const [note, setNote] = useState(initial?.optional_note ?? "");

  const hasSignal = Boolean(performance || tolerance || recovery || preference || note.trim());

  async function save() {
    if (busy || !hasSignal) return;
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase.rpc("save_my_exercise_response", {
        p_exercise_key: exerciseKey,
        p_entry_date: null,
        p_performance_status: performance || null,
        p_tolerance_status: tolerance || null,
        p_recovery_status: recovery || null,
        p_preference_status: preference || null,
        p_optional_note: note.trim() || null,
      });
      if (saveError) throw saveError;
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form" style={{ marginTop: 12 }}>
      <div className="kicker">Exercise Memory</div>
      <h3 style={{ margin: "4px 0 8px" }}>ท่านี้เป็นอย่างไรบ้าง? · {label}</h3>
      <p style={{ marginTop: 0 }}>ไม่ต้องกรอกทุกท่า บันทึกเมื่อมีอะไรที่สังเกตได้จริง เช่น ทำได้ดีขึ้น ท่ารู้สึกไม่เข้ากับคุณ หรือกำลังลองท่าใหม่ ระบบจะจำข้อมูลนี้ไว้ใช้ในการตัดสินใจครั้งต่อไป</p>
      <div className="form-grid">
        <label>ผลการฝึก
          <select value={performance} onChange={(e) => setPerformance(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="BETTER">ดีขึ้น</option>
            <option value="SAME">ใกล้เคียงเดิม</option>
            <option value="WORSE">แย่ลง</option>
          </select>
        </label>
        <label>การควบคุม / ความสบาย
          <select value={tolerance} onChange={(e) => setTolerance(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="GOOD">ดี</option>
            <option value="OK">พอใช้</option>
            <option value="POOR">ไม่ดี</option>
          </select>
        </label>
        <label>การฟื้นตัว
          <select value={recovery} onChange={(e) => setRecovery(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="GOOD">ดี</option>
            <option value="OK">พอใช้</option>
            <option value="POOR">ไม่ดี</option>
          </select>
        </label>
        <label>ความชอบ
          <select value={preference} onChange={(e) => setPreference(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="LIKE">ชอบ</option>
            <option value="NEUTRAL">เฉย ๆ</option>
            <option value="DISLIKE">ไม่ชอบ</option>
          </select>
        </label>
      </div>
      <label>หมายเหตุ (ไม่บังคับ)
        <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="เช่น คุมท่าได้ดีขึ้น หรือเครื่องนี้ไม่เข้ากับช่วงแขน" />
      </label>
      <button className="btn primary" type="button" disabled={busy || !hasSignal} onClick={save}>
        {busy ? "กำลังบันทึก..." : "บันทึกผลของท่านี้"}
      </button>
      {saved && <div className="notice">บันทึกแล้ว · Exercise Memory จะจำผลของท่านี้ไว้ใช้ครั้งต่อไป</div>}
      {error && <div className="notice warning">{error}</div>}
      {busy && <ProcessingOverlay title="กำลังบันทึกผลของท่านี้..." detail="กำลังอัปเดต Exercise Memory ของท่านี้" />}
    </div>
  );
}
