"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "บันทึกไม่สำเร็จ");
  }
  return "บันทึกไม่สำเร็จ";
}

export function PhysicalConsultTrialForm({ exerciseKey, label }: { exerciseKey: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [performance, setPerformance] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [preference, setPreference] = useState("");
  const [note, setNote] = useState("");

  const hasSignal = Boolean(performance || tolerance || preference || note.trim());

  async function save() {
    if (busy || !hasSignal) return;
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase.rpc("save_my_physical_consult_trial", {
        p_exercise_key: exerciseKey,
        p_performance_status: performance || null,
        p_tolerance_status: tolerance || null,
        p_recovery_status: null,
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

  return <div className="form" style={{ marginTop: 12 }}>
    <div className="kicker">PHYSICAL CONSULT · TRY & EVALUATE</div>
    <h3 style={{ margin: "4px 0 8px" }}>{label}</h3>
    <p style={{ marginTop: 0 }}>บันทึกสิ่งที่สังเกตได้จากการลองท่าจริงตอนนี้ ไม่ต้องรอให้ท่านี้ถูกใส่ใน Active Program ก่อน.</p>
    <div className="form-grid">
      <label>เทียบกับท่าที่ใช้อยู่
        <select value={performance} onChange={(e) => { setPerformance(e.target.value); setSaved(false); }}>
          <option value="">ยังเทียบไม่ได้</option>
          <option value="BETTER">ดีกว่า</option>
          <option value="SAME">ใกล้เคียง</option>
          <option value="WORSE">แย่กว่า</option>
        </select>
      </label>
      <label>Control / Tolerance
        <select value={tolerance} onChange={(e) => { setTolerance(e.target.value); setSaved(false); }}>
          <option value="">ไม่ระบุ</option>
          <option value="GOOD">ดี</option>
          <option value="OK">พอใช้</option>
          <option value="POOR">ไม่ดี</option>
        </select>
      </label>
      <label>Preference
        <select value={preference} onChange={(e) => { setPreference(e.target.value); setSaved(false); }}>
          <option value="">ไม่ระบุ</option>
          <option value="LIKE">ชอบ</option>
          <option value="NEUTRAL">เฉย ๆ</option>
          <option value="DISLIKE">ไม่ชอบ</option>
        </select>
      </label>
    </div>
    <label>Trainer note (ไม่บังคับ)
      <input value={note} maxLength={500} onChange={(e) => { setNote(e.target.value); setSaved(false); }} placeholder="เช่น คุมแนวได้ง่ายกว่า แต่ช่วงล่างยังต้องปรับ setup" />
    </label>
    <small>Recovery ไม่ถามในจุดนี้ เพราะยังประเมินจากการทดลองทันทีไม่ได้ หากมีข้อมูลภายหลังให้บันทึกจาก Active Program feedback.</small>
    <button className="btn primary" type="button" disabled={busy || !hasSignal} onClick={save}>
      {busy ? "กำลังบันทึก..." : saved ? "บันทึก trial แล้ว" : "บันทึกผลทดลองจริง"}
    </button>
    {saved && <div className="notice">บันทึกแล้ว · Exercise Memory ใช้ผลทดลองจริงนี้เป็น evidence ที่มี priority สูงกว่า LAB prediction.</div>}
    {error && <div className="notice warning">{error}</div>}
    {busy && <ProcessingOverlay title="กำลังบันทึก Physical Consult trial..." detail="กำลังอัปเดต Exercise Memory จากผลทดลองจริง" />}
  </div>;
}
