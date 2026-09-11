"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "บันทึกนัดไม่สำเร็จ");
  return "บันทึกนัดไม่สำเร็จ";
}

export function ProConsultScheduleForm({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [dateTime, setDateTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function schedule() {
    if (busy || !dateTime) return;
    setBusy(true);
    setSuccess("");
    setWarning("");
    setError("");
    try {
      const supabase = createClient();
      const scheduledAt = `${dateTime}:00+07:00`;
      const { data, error: scheduleError } = await supabase.rpc("pro_schedule_consult", {
        p_meeting_id: meetingId,
        p_scheduled_at: scheduledAt,
      });
      if (scheduleError) throw scheduleError;

      const result = data as { request_code?: string } | null;
      const { error: notifyError } = await supabase.functions.invoke("kdk-consult-email", {
        body: { event: "APPOINTMENT_SCHEDULED", meetingId },
      });
      if (notifyError) {
        setWarning("รับนัดแล้ว แต่การแจ้งอีเมลไปยัง user ยังไม่สำเร็จ สามารถตั้งเวลาเดิมซ้ำเพื่อ retry หลังแก้ระบบอีเมลได้");
      } else {
        setSuccess(`รับนัดแล้ว${result?.request_code ? ` · ${result.request_code}` : ""} และส่งอีเมลแจ้ง user แล้ว`);
      }
      router.refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return <div className="card form" style={{ marginTop: 18 }}>
    <div className="kicker">รับนัด</div>
    <h2>กำหนดวันและเวลา</h2>
    <p>เวลาใช้เขตเวลาไทย (Asia/Bangkok) การรับนัดยังไม่หักสิทธิ์ consult จนกว่าจะมีการใช้งานจริง</p>
    <label>วันและเวลา
      <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
    </label>
    <button className="btn primary" type="button" disabled={busy || !dateTime} onClick={schedule}>
      {busy ? "กำลังรับนัด..." : "รับนัดและแจ้ง user"}
    </button>
    {success && <div className="notice">{success}</div>}
    {warning && <div className="notice warning">{warning}</div>}
    {error && <div className="notice warning">{error}</div>}
    {busy && <ProcessingOverlay title="กำลังรับนัด..." detail="กำลังบันทึกวันเวลาและส่งอีเมลแจ้ง user" />}
  </div>;
}
