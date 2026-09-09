import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type GoalSnapshot = {
  goal?: string;
  training_experience?: string;
  training_days_per_week?: number;
  equipment_profile?: string;
  program_family?: string;
  focus_label?: string;
  primary_focus?: string;
  session_duration_min?: number;
};

function focusFromProfile(p: unknown) {
  if (typeof p === "string") return p.toUpperCase();
  if (Array.isArray(p)) return String(p[0] ?? "").toUpperCase();
  if (p && typeof p === "object") {
    const x = p as Record<string, unknown>;
    return String(x.primary ?? x.focus ?? x.primary_focus ?? "").toUpperCase();
  }
  return "";
}

export default async function HomePage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">Supabase env ยังไม่ถูก inject.</div></AppShell>;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const [{ data: baseline }, { data: training }, { data: access }, { data: activeProgram }] = await Promise.all([
    supabase.from("user_baseline").select("goal,training_experience,training_days_per_week,equipment_profile,weight_kg").eq("user_id", userId).maybeSingle(),
    supabase.from("training_profiles").select("session_duration_min,priority_muscles").eq("user_id", userId).maybeSingle(),
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version,goal_snapshot").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);

  const tier = access?.tier ?? "FREE";
  if (!baseline) return <AppShell>
    <div className="topline">{tier} Foundation</div><h1>เริ่มจากข้อมูลที่เปลี่ยน Program จริง</h1>
    <div className="card"><h2>ยังไม่มี Foundation inputs</h2><p>เลือก Goal, Focus, Training Days, Experience, Equipment และ Session Time ก่อน.</p><Link className="btn primary" href="/program/start">Start My Program</Link></div>
  </AppShell>;

  const snapshot = (activeProgram?.goal_snapshot ?? {}) as GoalSnapshot;
  const pending = Boolean(activeProgram) && (
    snapshot.goal !== baseline.goal ||
    snapshot.training_experience !== baseline.training_experience ||
    Number(snapshot.training_days_per_week) !== Number(baseline.training_days_per_week) ||
    snapshot.equipment_profile !== baseline.equipment_profile ||
    snapshot.primary_focus !== focusFromProfile(training?.priority_muscles) ||
    Number(snapshot.session_duration_min) !== Number(training?.session_duration_min)
  );

  return <AppShell>
    <div className="topline">{tier} Foundation</div><h1>{activeProgram ? "Active Program พร้อมใช้งาน" : "Foundation พร้อมสร้าง Program"}</h1>
    <div className="grid">
      <div className="card"><div className="kicker">Goal</div><div className="metric">{String(baseline.goal)}</div></div>
      <div className="card"><div className="kicker">Focus</div><div className="metric cyan">{focusFromProfile(training?.priority_muscles) || "–"}</div></div>
      <div className="card"><div className="kicker">Training</div><div className="metric">{String(baseline.training_days_per_week)} d/wk</div><p>{training?.session_duration_min ?? "–"} min/session</p></div>
      <div className="card"><div className="kicker">Program</div><div className="metric">{activeProgram ? `v${activeProgram.program_version}` : "Preview"}</div><p>{activeProgram ? snapshot.program_family ?? "Active" : "Not activated yet"}</p></div>
    </div>
    {pending && <div className="notice warning" style={{marginTop:18}}>Foundation inputs เปลี่ยนจาก Active Program. Program เดิมยังคง active จนกว่าจะ Activate version ใหม่.</div>}
    <div className="cta-row">
      {activeProgram ? <Link className="btn primary" href="/program">Open Active Program</Link> : <Link className="btn primary" href="/program/preview">Open Preview</Link>}
      {pending && <Link className="btn" href="/program/preview">Preview New Version</Link>}
      {tier === "PRO" && <Link className="btn" href="/physical-consult">Physical Consult</Link>}
      <Link className="btn" href="/progress">Progress</Link>
      <Link className="btn" href="/program/start">Update Inputs</Link>
    </div>
  </AppShell>;
}
