"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProgressForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    weight: "", trainingCompleted: false, trainingStatus: "", recoveryStatus: "", adherenceStatus: "", newIssue: false, note: "",
  });

  async function save() {
    setBusy(true); setError("");
    const supabase = createClient();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const { error: insertError } = await supabase.from("progress_entries").insert({
      user_id: userId,
      entry_date: today,
      body_weight_kg: form.weight ? Number(form.weight) : null,
      training_completed: form.trainingCompleted || null,
      training_status: form.trainingStatus || null,
      recovery_status: form.recoveryStatus || null,
      adherence_status: form.adherenceStatus || null,
      new_issue: form.newIssue,
      optional_note: form.note || null,
    });
    if (insertError) setError(insertError.message);
    else { setForm({ weight: "", trainingCompleted: false, trainingStatus: "", recoveryStatus: "", adherenceStatus: "", newIssue: false, note: "" }); router.refresh(); }
    setBusy(false);
  }

  return <div className="card form">
    <h2>Quick Check · ~30 sec</h2>
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
    {error && <div className="notice warning">{error}</div>}
  </div>;
}
