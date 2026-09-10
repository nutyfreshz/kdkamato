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
      setMessage("พร้อมใช้งานแล้ว · เปิด Physical Consult Login บนเครื่อง Trainer แล้วใช้อีเมลกับรหัสผ่านนี้");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ตั้งรหัสไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return <div className="card" style={{ marginTop: 18 }}>
    <div className="kicker">Physical Consult Access</div>
    <h2>ให้ Trainer ใช้ Physical Consult โดยไม่ต้องเปิด Gmail ของคุณบนเครื่อง Trainer</h2>
    <p>ใช้อีเมลเดิมของบัญชี <b>{email}</b> แล้วตั้งรหัสผ่านสำหรับ Physical Consult วิธีนี้ใช้บัญชีเดิมและไม่สร้างผู้ใช้ใหม่</p>
    <div className="form" style={{ maxWidth: 520 }}>
      <label>รหัสผ่าน Physical Consult
        <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setSaved(false); }} autoComplete="new-password" />
      </label>
      <label>ยืนยันรหัสผ่าน
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>
      <button className="btn primary" type="button" onClick={savePassword} disabled={busy || password.length < 10 || confirm.length < 10}>
        {busy ? "กำลังตั้งค่า..." : saved ? "ตั้งค่าแล้ว" : "ตั้ง / เปลี่ยนรหัสผ่าน Physical Consult"}
      </button>
      <small>รหัสนี้ใช้เข้าสู่บัญชีของคุณสำหรับ Physical Consult เท่านั้น ควรให้เฉพาะ Trainer ที่คุณอนุญาต และเปลี่ยนได้จากหน้านี้ทุกเมื่อ</small>
      {message && <div className="notice warning">{message}</div>}
    </div>
    <div className="cta-row" style={{ marginTop: 14 }}>
      <Link className="btn" href="/login?physical=1">ดู Physical Consult Login</Link>
      <Link className="btn" href="/physical-consult">เปิด Physical Consult Session บนอุปกรณ์นี้</Link>
    </div>
    <p style={{ marginBottom: 0 }}><small>บนเครื่อง Trainer ให้เปิด <b>kdkamato.vercel.app/login?physical=1</b> แล้วใช้อีเมลกับรหัสผ่าน Physical Consult เมื่อจบ session ระบบมีปุ่มออกจากระบบเฉพาะเครื่อง Trainer</small></p>
    {busy && <ProcessingOverlay title="กำลังตั้งค่าการเข้าถึง Physical Consult…" detail="กำลังเพิ่มหรือเปลี่ยนการเข้าสู่ระบบด้วยอีเมลและรหัสผ่านให้บัญชีเดิม" />}
  </div>;
}
