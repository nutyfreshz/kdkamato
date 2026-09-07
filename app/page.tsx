import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default function LandingPage() {
  const connected = hasSupabaseEnv();
  return (
    <main className="main">
      <section className="hero">
        <div className="topline">KDKAMATO Program</div>
        <h1>เริ่มจากระบบที่ใช้ได้จริง<br/>แล้วค่อย Personalize จากข้อมูลของคุณ</h1>
        <p>FREE คือ Training + Nutrition Foundation ที่ใช้งานได้จริง ไม่ใช่ teaser. ข้อมูลเดิมจะต่อยอดเข้า KDKAMATO Lab และ PRO ได้โดยไม่ต้องเริ่มใหม่.</p>
        <div className="cta-row"><Link className="btn primary" href={connected ? "/home" : "/login"}>Start My Program</Link></div>
      </section>
      <section className="grid">
        <div className="card"><div className="kicker">Training</div><div className="metric">Simple first</div><p>Limited program families, clear progression, practical substitutions.</p></div>
        <div className="card"><div className="kicker">Nutrition</div><div className="metric cyan">Range, not fake precision</div><p>Protein first, measurable inputs, then calibrate from real response.</p></div>
        <div className="card"><div className="kicker">Continuity</div><div className="metric">Free → PRO</div><p>One account, one history, no restart when personalization becomes useful.</p></div>
      </section>
      {!connected && <div className="notice warning" style={{ marginTop: 20 }}>Application package ยังไม่ได้ใส่ public Supabase env ใน runtime นี้ จึงเปิดหน้า Login แทนการทำ live read/write.</div>}
    </main>
  );
}
