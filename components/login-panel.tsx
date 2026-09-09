"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

export function LoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("กำลังเข้าสู่ระบบ...");

  const [consultOpen, setConsultOpen] = useState(false);
  const [consultEmail, setConsultEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  async function submit() {
    if (busy) return;
    setBusyLabel(mode === "login" ? "กำลังเข้าสู่ระบบ..." : "กำลังสร้างบัญชี...");
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        setMessage("สร้างบัญชีแล้ว กรุณาตรวจอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ");
        setBusy(false);
      } else {
        router.push("/home"); router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้");
      setBusy(false);
    }
  }

  async function google() {
    if (busy) return;
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

  async function sendConsultOtp() {
    if (busy || !consultEmail) return;
    setBusyLabel("กำลังส่งรหัสเข้าอีเมลผู้ใช้...");
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: consultEmail.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setOtpSent(true);
      setMessage("ส่งรหัสแล้ว ให้ผู้ใช้เปิดอีเมลของตัวเองและแจ้งรหัส 6 หลักเพื่อเข้าสู่ระบบบนเครื่องนี้");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถส่งรหัสได้");
    } finally {
      setBusy(false);
    }
  }

  async function verifyConsultOtp() {
    if (busy || !consultEmail || otp.trim().length !== 6) return;
    setBusyLabel("กำลังยืนยันรหัส Physical Consult...");
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: consultEmail.trim(),
        token: otp.trim(),
        type: "email",
      });
      if (error) throw error;
      router.push("/home");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "รหัสไม่ถูกต้องหรือหมดอายุ");
      setBusy(false);
    }
  }

  return (
    <div className="card form" style={{ maxWidth: 520 }}>
      <button className="btn" onClick={google} disabled={busy}>Continue with Google</button>
      <div className="help">หรือใช้ Email + Password</div>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
      <button className="btn primary" onClick={submit} disabled={busy || !email || password.length < 6}>{busy ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</button>
      <button className="btn ghost" disabled={busy} onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "ยังไม่มีบัญชี? สร้างบัญชี" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}</button>

      <div className="help" style={{ marginTop: 14 }}>Physical Consult</div>
      <button className="btn ghost" type="button" disabled={busy} onClick={() => { setConsultOpen(!consultOpen); setMessage(""); }}>
        {consultOpen ? "ปิดการเข้าสู่ระบบด้วยรหัสอีเมล" : "เข้าสู่ระบบบนเครื่อง Trainer ด้วยรหัสอีเมล"}
      </button>

      {consultOpen && <div className="form" style={{ marginTop: 10 }}>
        <div className="help">ผู้ใช้ไม่ต้อง login Gmail บนเครื่อง Trainer — ให้ผู้ใช้รับรหัสจากอีเมลบนมือถือของตัวเอง</div>
        <label>Email ของผู้ใช้<input type="email" value={consultEmail} onChange={(e) => { setConsultEmail(e.target.value); setOtpSent(false); setOtp(""); }} autoComplete="email" /></label>
        <button className="btn" type="button" onClick={sendConsultOtp} disabled={busy || !consultEmail}>ส่งรหัส 6 หลัก</button>
        {otpSent && <>
          <label>รหัส 6 หลัก<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" /></label>
          <button className="btn primary" type="button" onClick={verifyConsultOtp} disabled={busy || otp.length !== 6}>ยืนยันและเข้าสู่ระบบ</button>
        </>}
      </div>}

      {busy && <ProcessingOverlay title={busyLabel} detail="กรุณารอสักครู่ และไม่ต้องกดปุ่มซ้ำ" />}
      {message && <div className="notice warning">{message}</div>}
    </div>
  );
}
