"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

export function LoginPanel({ redirectTo = "/home", physicalMode = false }: { redirectTo?: string; physicalMode?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("กำลังเข้าสู่ระบบ...");

  async function submit() {
    if (busy) return;
    const effectiveMode = physicalMode ? "login" : mode;
    setBusyLabel(effectiveMode === "login" ? "กำลังเข้าสู่ระบบ..." : "กำลังสร้างบัญชี...");
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const result = effectiveMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (effectiveMode === "signup" && !result.data.session) {
        setMessage("สร้างบัญชีแล้ว กรุณาตรวจอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ");
        setBusy(false);
      } else {
        router.push(redirectTo); router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้");
      setBusy(false);
    }
  }

  async function google() {
    if (busy || physicalMode) return;
    setBusyLabel("กำลังเชื่อมต่อ Google...");
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Google sign-in ไม่สำเร็จ");
    }
  }

  return (
    <div className="card form" style={{ maxWidth: 520 }}>
      {physicalMode ? <div className="notice" style={{ marginBottom: 12 }}>
        <strong>Physical Consult · Trainer device</strong>
        <p style={{ marginBottom: 0 }}>ใช้ Email + Physical Consult password ของ user เดิม. หน้านี้ไม่ใช้ Google login และไม่สร้าง account ใหม่.</p>
      </div> : <>
        <button className="btn" onClick={google} disabled={busy}>Continue with Google</button>
        <div className="help">หรือใช้ Email + Password</div>
      </>}
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
      <button className="btn primary" onClick={submit} disabled={busy || !email || password.length < 6}>{busy ? "กำลังดำเนินการ..." : physicalMode ? "เข้า Physical Consult Session" : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</button>
      {!physicalMode && <button className="btn ghost" disabled={busy} onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "ยังไม่มีบัญชี? สร้างบัญชี" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}</button>}
      {!physicalMode && <div className="help" style={{ marginTop: 14 }}>
        Physical Consult: ถ้าปกติเข้าด้วย Google ให้ตั้ง Physical Consult password ที่หน้า Account ก่อน แล้วเปิดหน้า Physical Consult Login บนเครื่อง Trainer
      </div>}
      {physicalMode && <div className="help" style={{ marginTop: 14 }}>เมื่อจบ consult ให้ใช้ปุ่ม “จบ Physical Consult และ Sign out เครื่องนี้” เพื่อปิดเฉพาะ session ของเครื่อง Trainer.</div>}
      {busy && <ProcessingOverlay title={busyLabel} detail="กรุณารอสักครู่ และไม่ต้องกดปุ่มซ้ำ" />}
      {message && <div className="notice warning">{message}</div>}
    </div>
  );
}
