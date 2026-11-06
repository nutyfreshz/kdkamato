"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

export function PhysicalConsultAccess({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  async function savePassword() {
    if (busy) return;
    if (password.length < 10) {
      setMessage("ใช้รหัสอย่างน้อย 10 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setMessage("รหัสทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSaved(true);
      setPassword("");
      setConfirm("");
      setMessage("พร้อมใช้งานแล้ว เปิดหน้าเข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์บนอุปกรณ์เทรนเนอร์ แล้วใช้อีเมลกับรหัสผ่านนี้");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ตั้งรหัสไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return <div className="card" style={{ marginTop: 18 }}>
    <div className="kicker">ตั้งค่าการเข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์</div>
    <h2>การเข้าใช้ การปรึกษาเทรนเนอร์ บนอุปกรณ์เทรนเนอร์</h2>
    <p>ใช้อีเมลเดิม <b>{email}</b> และตั้งรหัสผ่านสำหรับปรึกษาเทรนเนอร์ โดยยังใช้บัญชีเดิม</p>
    <div className="form" style={{ maxWidth: 520 }}>
      <label>รหัสผ่านสำหรับปรึกษาเทรนเนอร์<input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setSaved(false); }} autoComplete="new-password" /></label>
      <label>ยืนยันรหัสผ่าน
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>
      <button className="btn primary" type="button" onClick={savePassword} disabled={busy || password.length < 10 || confirm.length < 10}>
        {busy ? "กำลังตั้งค่า…" : saved ? "ตั้งค่าแล้ว" : "ตั้งหรือเปลี่ยนรหัสผ่านสำหรับปรึกษาเทรนเนอร์"}
      </button>
      <small>ใช้รหัสนี้เข้าสู่บัญชีเพื่อปรึกษาเทรนเนอร์ ให้เฉพาะเทรนเนอร์ที่คุณอนุญาต และเปลี่ยนได้จากหน้านี้</small>
      {message && <div className="notice warning" role={saved ? "status" : "alert"}>{message}</div>}
    </div>
    <div className="cta-row" style={{ marginTop: 14 }}>
      <Link className="btn" href="/login?physical=1">ดูหน้าเข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์</Link>
      <Link className="btn" href="/physical-consult">เปิดหน้าปรึกษาเทรนเนอร์บนอุปกรณ์นี้</Link>
    </div>
    <p style={{ marginBottom: 0 }}><small>บนอุปกรณ์เทรนเนอร์ ให้เปิด <b>kdkamato.vercel.app/login?physical=1</b> แล้วใช้อีเมลและรหัสผ่านสำหรับปรึกษาเทรนเนอร์ เมื่อเสร็จแล้วให้ออกจากระบบเฉพาะอุปกรณ์นั้น</small></p>
    {busy && <ProcessingOverlay title={"กำลังตั้งค่าการเข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์…"} detail={"กำลังตั้งค่าการเข้าสู่ระบบด้วยอีเมลและรหัสผ่านให้บัญชีเดิม"} />}
  </div>;
}
