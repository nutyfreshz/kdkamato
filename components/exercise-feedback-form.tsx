"use client";

import { useState } from "react";
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
    return String((error as { message?: unknown }).message ?? "Save failed");
  }
  return "Save failed";
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
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form" style={{ marginTop: 12 }}>
      <div className="kicker">PRO Exercise Memory</div>
      <h3 style={{ margin: "4px 0 8px" }}>Quick feedback · {label}</h3>
      <p style={{ marginTop: 0 }}>ใส่เฉพาะสิ่งที่สังเกตได้จริง ไม่จำเป็นต้องกรอกทุกช่อง ระบบจะใช้ข้อมูลนี้เป็นหลักฐานประกอบ Program รอบถัดไป</p>
      <div className="form-grid">
        <label>Performance
          <select value={performance} onChange={(e) => setPerformance(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="BETTER">Better</option>
            <option value="SAME">Same</option>
            <option value="WORSE">Worse</option>
          </select>
        </label>
        <label>Movement tolerance
          <select value={tolerance} onChange={(e) => setTolerance(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="GOOD">Good</option>
            <option value="OK">OK</option>
            <option value="POOR">Poor</option>
          </select>
        </label>
        <label>Recovery
          <select value={recovery} onChange={(e) => setRecovery(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="GOOD">Good</option>
            <option value="OK">OK</option>
            <option value="POOR">Poor</option>
          </select>
        </label>
        <label>Preference
          <select value={preference} onChange={(e) => setPreference(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="LIKE">Like</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="DISLIKE">Dislike</option>
          </select>
        </label>
      </div>
      <label>Note (optional)
        <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="เช่น รู้สึกคุมท่าได้ดีขึ้น หรือเครื่องนี้ไม่เข้ากับช่วงแขน" />
      </label>
      <button className="btn primary" type="button" disabled={busy || !hasSignal} onClick={save}>
        {busy ? "Saving..." : "Save Exercise Feedback"}
      </button>
      {saved && <div className="notice">Saved. Exercise Memory ถูก refresh จากข้อมูลล่าสุดแล้ว.</div>}
      {error && <div className="notice warning">{error}</div>}
      {busy && <ProcessingOverlay title="กำลังบันทึก Exercise Feedback..." detail="กำลังอัปเดต longitudinal Exercise Memory ของท่านี้" />}
    </div>
  );
}
