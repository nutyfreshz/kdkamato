import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let baseline: Record<string, unknown> | null = null;
  let tier = "FREE";
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getClaims();
    const userId = auth?.claims?.sub as string | undefined;
    if (userId) {
      const [{ data: b }, { data: a }] = await Promise.all([
        supabase.from("user_baseline").select("goal,training_days_per_week,weight_kg").eq("user_id", userId).maybeSingle(),
        supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
      ]);
      baseline = b; tier = a?.tier ?? "FREE";
    }
  }
  return <AppShell><div className="topline">{tier} Foundation</div><h1 style={{ fontSize: "3.4rem" }}>วันนี้ต้องรู้อะไรแค่พอให้ไปต่อได้</h1>{baseline ? <div className="grid"><div className="card"><div className="kicker">Goal</div><div className="metric">{String(baseline.goal)}</div></div><div className="card"><div className="kicker">Training Days</div><div className="metric cyan">{String(baseline.training_days_per_week)} / wk</div></div><div className="card"><div className="kicker">Next</div><div className="metric">Program</div><Link className="btn" href="/program/preview">Open preview</Link></div></div> : <div className="card"><h2>ยังไม่มี Foundation inputs</h2><p>เริ่มจากข้อมูลขั้นต่ำที่เปลี่ยน recommendation จริงก่อน ไม่บังคับกรอกทุกอย่าง.</p><Link className="btn primary" href="/program/start">Start My Program</Link></div>}</AppShell>;
}
