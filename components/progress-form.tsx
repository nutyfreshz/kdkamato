"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InitialProgress = {
  body_weight_kg?: number | string | null;
  training_completed?: boolean | null;
  training_status?: string | null;
  recovery_status?: string | null;
  adherence_status?: string | null;
  new_issue?: boolean | null;
  optional_note?: string | null;
};

function readableError(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message?: unknown }).message ?? "บันทึกไม่สำเร็จ");
  return "บันทึกไม่สำเร็จ";
}

export function ProgressForm({ hasActiveProgram, initial }: { hasActiveProgram: boolean; initial?: InitialProgress | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    weight: initial?.body_weight_kg == null ? "" : String(initial.body_weight_kg),
    trainingCompleted: Boolean(initial?.training_completed),
    trainingStatus: initial?.training_status ?? "",
    recoveryStatus: initial?.recovery_status ?? "",
    adherenceStatus: initial?.adherence_status ?? "",
    newIssue: Boolean(initial?.new_issue),
    note: initial?.optional_note ?? "",
  });

  async function save() {
    if (busy) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const supabase = createClient();
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());

      const { error: saveError } = await supabase.rpc("save_my_progress_check", {
        p_entry_date: today,
        p_body_weight_kg: form.weight ? Number(form.weight) : null,
        p_training_completed: form.trainingCompleted ? true : null,
        p_training_status: form.trainingStatus || null,
        p_recovery_status: form.recoveryStatus || null,
        p_adherence_status: form.adherenceStatus || null,
        p_new_issue: form.newIssue,
        p_optional_note: form.note || null,
      });
      if (saveError) throw saveError;
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  }

  return <div className="card form">
    <h2>เช็กอินสั้น ๆ · ประมาณ 30 วินาที</h2>
    <p>{hasActiveProgram ? "ข้อมูลวันนี้จะผูกกับ Program ปัจจุบันโดยอัตโนมัติ" : "ยังไม่มี Program ปัจจุบัน — บันทึกน้ำหนักได้ แต่ผลการฝึกจะยังไม่เชื่อมกับ Program"}</p>
    <div className="form-grid">
      <label>น้ำหนักวันนี้ (ไม่บังคับ)<input inputMode="decimal" value={form.weight} onChange={(e)=>setForm({...form,weight:e.target.value})} placeholder="kg" /></label>
      <label>ผลการฝึก<select value={form.trainingStatus} onChange={(e)=>setForm({...form,trainingStatus:e.target.value})}><option value="">ไม่ระบุ</option><option value="BETTER">ดีขึ้น</option><option value="SAME">ใกล้เคียงเดิม</option><option value="WORSE">แย่ลง</option></select></label>
      <label>การฟื้นตัว<select value={form.recoveryStatus} onChange={(e)=>setForm({...form,recoveryStatus:e.target.value})}><option value="">ไม่ระบุ</option><option value="GOOD">ดี</option><option value="OK">พอใช้</option><option value="POOR">ยังฟื้นไม่ดี</option></select></label>
      <label>ความสม่ำเสมอ<select value={form.adherenceStatus} onChange={(e)=>setForm({...form,adherenceStatus:e.target.value})}><option value="">ไม่ระบุ</option><option value="HIGH">ทำได้เกือบครบ</option><option value="MEDIUM">ทำได้บางส่วน</option><option value="LOW">ทำได้น้อย</option></select></label>
    </div>
    <label className="check"><input type="checkbox" checked={form.trainingCompleted} onChange={(e)=>setForm({...form,trainingCompleted:e.target.checked})}/> วันนี้ฝึกแล้ว</label>
    <label className="check"><input type="checkbox" checked={form.newIssue} onChange={(e)=>setForm({...form,newIssue:e.target.checked})}/> มีปัญหาใหม่</label>
    <label>หมายเหตุ (ไม่บังคับ)<input value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})} /></label>
    <button className="btn primary" onClick={save} disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึกการเช็กอิน"}</button>
    {busy && <div className="notice" role="status" aria-live="polite">กำลังบันทึกผลการฝึก</div>}
    {saved && <div className="notice" role="status" aria-live="polite">บันทึกแล้ว หากบันทึกซ้ำในวันเดียวกัน ระบบจะอัปเดตการเช็กอินเดิม</div>}
    {error && <div className="notice warning" role="alert">{error}</div>}
  </div>;
}
