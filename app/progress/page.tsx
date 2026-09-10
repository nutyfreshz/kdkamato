import { AppShell } from "@/components/app-shell";
import { ProgressForm } from "@/components/progress-form";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type Summary = {
  entries_count?: number;
  weight_entries_count?: number;
  latest_weight_kg?: number | null;
  weight_change_kg?: number | null;
  training_completed_count?: number;
  training_better_count?: number;
  training_same_count?: number;
  training_worse_count?: number;
  new_issue_count?: number;
};

type ProgressRow = {
  entry_date: string;
  training_completed: boolean | null;
  training_status: string | null;
  recovery_status: string | null;
  adherence_status: string | null;
  new_issue: boolean | null;
  body_weight_kg: number | null;
  optional_note: string | null;
  program_id: string | null;
};

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function ProgressPage(){
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const [{ data: summaryRaw }, { data: latestRaw }, { data: activeProgram }] = await Promise.all([
    supabase.rpc("get_my_progress_summary", { p_days: 30 }),
    supabase.from("progress_entries").select("entry_date,training_completed,training_status,recovery_status,adherence_status,new_issue,body_weight_kg,optional_note,program_id").eq("user_id", userId).order("entry_date", { ascending:false }).limit(5),
    supabase.from("programs").select("program_id,program_version").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);

  const summary = (summaryRaw ?? {}) as Summary;
  const latest = (latestRaw ?? []) as ProgressRow[];
  const today = bangkokDate();
  const todayRow = latest.find((x) => x.entry_date === today) ?? null;

  return <AppShell>
    <div className="topline">ความคืบหน้า · 30 วัน</div><h1>เช็กอินสั้น ๆ เพื่อให้ Program เรียนรู้จากการฝึกจริงของคุณ</h1>
    <div className="grid">
      <div className="card"><div className="kicker">น้ำหนักล่าสุด</div><div className="metric">{summary.latest_weight_kg ?? "–"} {summary.latest_weight_kg ? "kg" : ""}</div><p>เปลี่ยนแปลง: {summary.weight_change_kg ?? "–"} kg</p></div>
      <div className="card"><div className="kicker">จำนวนครั้งที่ฝึก</div><div className="metric cyan">{summary.training_completed_count ?? 0}</div><p>ดีขึ้น {summary.training_better_count ?? 0} · เท่าเดิม {summary.training_same_count ?? 0} · แย่ลง {summary.training_worse_count ?? 0}</p></div>
      <div className="card"><div className="kicker">Program ที่ใช้อยู่</div><div className="metric">{activeProgram ? `v${activeProgram.program_version}` : "–"}</div><p>{activeProgram ? "Check-in ใหม่จะผูกกับ Program version นี้อัตโนมัติ." : "เริ่มใช้ Program ก่อน เพื่อให้ระบบติดตามว่าร่างกายคุณตอบสนองอย่างไรต่อเนื่อง"}</p></div>
      <div className="card"><div className="kicker">Issue ใหม่</div><div className="metric">{summary.new_issue_count ?? 0}</div><p>{(summary.entries_count ?? 0) < 3 ? "ข้อมูลยังน้อยเกินไปสำหรับดูแนวโน้ม." : "ดูแนวโน้มหลายครั้ง ไม่ตัดสินจาก Check-in เดียว."}</p></div>
    </div>
    <div style={{marginTop:18}}><ProgressForm hasActiveProgram={Boolean(activeProgram)} initial={todayRow}/></div>
    {latest.length > 0 && <section className="card day"><h2>Check-in ล่าสุด</h2>{latest.map((x, i)=><div className="exercise" key={`${x.entry_date}-${i}`}><div><strong>{x.entry_date}</strong><br/><small>{x.training_status ?? "ไม่มี Training signal"}</small></div><div>{x.body_weight_kg ? `${x.body_weight_kg} kg` : "–"} · {x.recovery_status ?? "–"} · {x.adherence_status ?? "–"}</div></div>)}</section>}
  </AppShell>;
}
