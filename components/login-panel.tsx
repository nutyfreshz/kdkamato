"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

function authErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/invalid login credentials/i.test(message)) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง ตรวจสอบแล้วลองอีกครั้ง";
  if (/email not confirmed/i.test(message)) return "ยืนยันอีเมลก่อนเข้าสู่ระบบ";
  if (/user already registered/i.test(message)) return "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ";
  if (/password.*at least/i.test(message)) return "รหัสผ่านสั้นเกินไป กรุณาเพิ่มความยาวรหัสผ่าน";
  if (/rate limit|too many requests/i.test(message)) return "ลองเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
  return "ดำเนินการไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่";
}

export function LoginPanel({ redirectTo = "/home", physicalMode = false }: { redirectTo?: string; physicalMode?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("กำลังเข้าสู่ระบบ…");

  async function submit() {
    if (busy) return;
    const effectiveMode = physicalMode ? "login" : mode;
    setBusyLabel(effectiveMode === "login" ? "กำลังเข้าสู่ระบบ…" : "กำลังสร้างบัญชี…");
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const result = effectiveMode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (effectiveMode === "signup" && !result.data.session) {
        setMessage("สร้างบัญชีแล้ว กรุณาเปิดอีเมลยืนยันก่อนเข้าสู่ระบบ");
        setBusy(false);
      } else {
        router.push(redirectTo); router.refresh();
      }
    } catch (error) {
      setMessage(authErrorText(error));
      setBusy(false);
    }
  }

  async function google() {
    if (busy || physicalMode) return;
    setBusyLabel("กำลังเชื่อมต่อกับ Google…");
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
      setMessage(authErrorText(error));
    }
  }

  return (
    <div className="card form" style={{ maxWidth: 520 }}>
      {physicalMode ? <div className="notice" style={{ marginBottom: 12 }}>
        <strong>ปรึกษาเทรนเนอร์ · ใช้บนอุปกรณ์เทรนเนอร์</strong>
        <p style={{ marginBottom: 0 }}>ใช้อีเมลและรหัสผ่านสำหรับปรึกษาเทรนเนอร์ของบัญชีเดิม หน้านี้รองรับการเข้าสู่ระบบด้วยรหัสผ่านเท่านั้น</p>
      </div> : <>
        <button className="btn" onClick={google} disabled={busy}>ดำเนินการต่อด้วย Google</button>
        <div className="help">หรือใช้อีเมลและรหัสผ่าน</div>
      </>}
      <label>อีเมล<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>รหัสผ่าน<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
      <button className="btn primary" onClick={submit} disabled={busy || !email || password.length < 6}>{busy ? "กำลังดำเนินการ…" : physicalMode ? "เข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์" : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</button>
      {!physicalMode && <button className="btn ghost" disabled={busy} onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "ยังไม่มีบัญชี? สร้างบัญชีใหม่" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}</button>}
      {!physicalMode && <div className="help" style={{ marginTop: 14 }}>หากปกติใช้ Google ให้ตั้งรหัสผ่านสำหรับปรึกษาเทรนเนอร์ในหน้าบัญชีก่อน แล้วใช้รหัสผ่านนั้นเข้าสู่ระบบบนอุปกรณ์เทรนเนอร์</div>}
      {physicalMode && <div className="help" style={{ marginTop: 14 }}>เมื่อปรึกษาเสร็จ ให้กด “จบการปรึกษาและออกจากระบบเครื่องนี้” เพื่อออกจากระบบเฉพาะอุปกรณ์เทรนเนอร์</div>}
      {busy && <ProcessingOverlay title={busyLabel} detail={"กรุณารอสักครู่ ไม่ต้องกดซ้ำ"} />}
      {message && <div className="notice warning" role="alert">{message}</div>}
    </div>
  );
}
