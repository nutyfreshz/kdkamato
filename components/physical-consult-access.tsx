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
      setMessage("พร้อมใช้แล้ว: บนเครื่อง Trainer เปิด Physical Consult Login แล้วเข้า user เดิมด้วย Email + Password นี้");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ตั้งรหัสไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return <div className="card" style={{ marginTop: 18 }}>
    <div className="kicker">Physical Consult Access</div>
    <h2>ให้ Trainer เข้า user เดิมโดยไม่ต้อง login Gmail</h2>
    <p>ใช้ Email เดิมของบัญชี <b>{email}</b> แล้วตั้ง password สำหรับเข้าแบบ Email + Password. สำหรับบัญชีที่สร้างด้วย Google วิธีนี้เพิ่ม Email login ให้ user เดิม ไม่สร้าง user ใหม่.</p>
    <div className="form" style={{ maxWidth: 520 }}>
      <label>Physical Consult password
        <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setSaved(false); }} autoComplete="new-password" />
      </label>
      <label>ยืนยัน password
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </label>
      <button className="btn primary" type="button" onClick={savePassword} disabled={busy || password.length < 10 || confirm.length < 10}>
        {busy ? "กำลังตั้งค่า..." : saved ? "ตั้งค่าแล้ว" : "ตั้ง / เปลี่ยน Physical Consult password"}
      </button>
      <small>รหัสนี้เป็น credential ของ account เดียวกัน จึงควรใช้เฉพาะกับ Trainer ที่ได้รับอนุญาต และเปลี่ยนรหัสได้จากหน้านี้ภายหลัง.</small>
      {message && <div className="notice warning">{message}</div>}
    </div>
    <div className="cta-row" style={{ marginTop: 14 }}>
      <Link className="btn" href="/login?physical=1">ดู Physical Consult Login</Link>
      <Link className="btn" href="/physical-consult">เปิด Physical Consult Session บนอุปกรณ์นี้</Link>
    </div>
    <p style={{ marginBottom: 0 }}><small>บนเครื่อง Trainer ให้เปิด <b>kdkamato.vercel.app/login?physical=1</b> แล้วใช้ Email + Physical Consult password. เมื่อจบ session ระบบมีปุ่ม sign out เฉพาะเครื่อง Trainer.</small></p>
    {busy && <ProcessingOverlay title="กำลังตั้ง Physical Consult access…" detail="กำลังเพิ่มหรือเปลี่ยน Email + Password login ให้ user เดิม" />}
  </div>;
}
