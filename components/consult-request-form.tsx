"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "Request failed");
  return "Request failed";
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
    <div className="kicker">Optional Online Consult</div>
    <h2>Request Professional Review</h2>
    <p>PRO includes up to 2 online consult entitlements per calendar month. Sending a request does not consume an entitlement until the meeting is actually used.</p>
    <label>What do you want reviewed? (optional)
      <input value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="Training, nutrition, exercise fit, or another question" />
    </label>
    <button className="btn primary" type="button" onClick={submit} disabled={busy || sent}>
      {sent ? "Request Sent" : busy ? "Sending..." : "Request Consult"}
    </button>
    {sent && <div className="notice">Request received. A professional review item has been created.</div>}
    {error && <div className="notice warning">{error}</div>}
    {busy && <ProcessingOverlay title="กำลังส่ง Consult Request..." detail="กำลังสร้าง Professional Review request โดยยังไม่ตัดสิทธิ์ meeting" />}
  </div>;
}
