"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

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
  if (e && typeof e === "object" && "message" in e) return String((e as { message?: unknown }).message ?? "Save failed");
  return "Save failed";
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
    <h2>Quick Check · ~30 sec</h2>
    <p>{hasActiveProgram ? "วันนี้จะผูกกับ Active Program โดย server อัตโนมัติ" : "ยังไม่มี Active Program — บันทึกน้ำหนักได้ แต่ training response จะยังไม่ผูกกับ Program"}</p>
    <div className="form-grid">
      <label>น้ำหนักวันนี้ (optional)<input inputMode="decimal" value={form.weight} onChange={(e)=>setForm({...form,weight:e.target.value})} placeholder="kg" /></label>
      <label>Training<select value={form.trainingStatus} onChange={(e)=>setForm({...form,trainingStatus:e.target.value})}><option value="">ไม่ระบุ</option><option value="BETTER">Better</option><option value="SAME">Same</option><option value="WORSE">Worse</option></select></label>
      <label>Recovery<select value={form.recoveryStatus} onChange={(e)=>setForm({...form,recoveryStatus:e.target.value})}><option value="">ไม่ระบุ</option><option value="GOOD">Good</option><option value="OK">OK</option><option value="POOR">Not recovered</option></select></label>
      <label>Adherence<select value={form.adherenceStatus} onChange={(e)=>setForm({...form,adherenceStatus:e.target.value})}><option value="">ไม่ระบุ</option><option value="HIGH">Almost all</option><option value="MEDIUM">Some</option><option value="LOW">Little</option></select></label>
    </div>
    <label className="check"><input type="checkbox" checked={form.trainingCompleted} onChange={(e)=>setForm({...form,trainingCompleted:e.target.checked})}/> Training done</label>
    <label className="check"><input type="checkbox" checked={form.newIssue} onChange={(e)=>setForm({...form,newIssue:e.target.checked})}/> มี issue ใหม่</label>
    <label>Note (optional)<input value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})} /></label>
    <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save Check"}</button>
    {busy && <ProcessingOverlay title="กำลังบันทึก Progress..." detail="กำลังผูก Daily Check กับ Program version ที่ใช้งานอยู่" />}
    {saved && <div className="notice">Saved. กด Save ซ้ำในวันเดียวกันจะอัปเดต Daily Check เดิม.</div>}
    {error && <div className="notice warning">{error}</div>}
  </div>;
}
