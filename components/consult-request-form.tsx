"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "ส่งคำขอไม่สำเร็จ");
  return "ส่งคำขอไม่สำเร็จ";
}

export function ConsultRequestForm() {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy || sent) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: requestError } = await supabase.rpc("request_my_online_consult", {
        p_user_reason: reason.trim() || null,
      });
      if (requestError) throw requestError;
      setSent(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return <div className="card form">
    <div className="kicker">การปรึกษาออนไลน์เพิ่มเติม</div>
    <h2>ขอให้ PRO ช่วยทบทวนเพิ่มเติม</h2>
    <p>PRO ใช้การปรึกษาออนไลน์ได้สูงสุด 2 ครั้งต่อเดือน การส่งคำขอยังไม่ตัดสิทธิ์จนกว่าจะมีการใช้การปรึกษาจริง</p>
    <label>อยากให้ช่วยดูเรื่องอะไร? (ไม่บังคับ)
      <input value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="เช่น การฝึก โภชนาการ Exercise Fit หรือคำถามอื่น" />
    </label>
    <button className="btn primary" type="button" onClick={submit} disabled={busy || sent}>
      {sent ? "ส่งคำขอแล้ว" : busy ? "กำลังส่ง..." : "ส่งคำขอปรึกษา"}
    </button>
    {sent && <div className="notice">รับคำขอแล้ว ระบบส่งเรื่องเข้าสู่การทบทวนโดย PRO เรียบร้อย</div>}
    {error && <div className="notice warning">{error}</div>}
    {busy && <ProcessingOverlay title="กำลังส่งคำขอปรึกษา..." detail="กำลังสร้างคำขอเพื่อให้ PRO ทบทวน โดยยังไม่ตัดสิทธิ์การปรึกษา" />}
  </div>;
}
