"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "ส่งคำขอไม่สำเร็จ");
  return "ส่งคำขอไม่สำเร็จ";
}

function requestCode(meetingId: string) {
  return `PC-${meetingId.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export function ConsultRequestForm() {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (busy || sent) return;
    setBusy(true);
    setError("");
    setWarning("");
    try {
      const supabase = createClient();
      const { data, error: requestError } = await supabase.rpc("request_my_online_consult", {
        p_user_reason: reason.trim() || null,
      });
      if (requestError) throw requestError;

      const result = data as { meeting_id?: string } | null;
      const meetingId = result?.meeting_id ?? "";
      if (meetingId) {
        setRequestId(requestCode(meetingId));
        const { error: notifyError } = await supabase.functions.invoke("kdk-consult-email", {
          body: { event: "REQUEST_CREATED", meetingId },
        });
        if (notifyError) setWarning("บันทึกคำขอแล้ว แต่ระบบแจ้งเตือนอีเมล PRO ยังไม่สำเร็จ ทีมงานยังสามารถเห็นคำขอนี้ใน PRO Consult ได้");
      }
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
    {sent && <div className="notice">รับคำขอแล้ว{requestId ? ` · เลขคำขอ ${requestId}` : ""} ระบบส่งเรื่องเข้าสู่การทบทวนโดย PRO เรียบร้อย</div>}
    {warning && <div className="notice warning">{warning}</div>}
    {error && <div className="notice warning">{error}</div>}
    {busy && <ProcessingOverlay title="กำลังส่งคำขอปรึกษา..." detail="กำลังสร้างคำขอเพื่อให้ PRO ทบทวน โดยยังไม่ตัดสิทธิ์การปรึกษา" />}
  </div>;
}
