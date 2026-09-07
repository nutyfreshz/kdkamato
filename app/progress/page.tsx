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

export default async function ProgressPage(){
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">Supabase env ยังไม่ถูก inject.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;
  const [{ data: summaryRaw }, { data: latest }] = await Promise.all([
    supabase.rpc("get_my_progress_summary", { p_days: 30 }),
    supabase.from("progress_entries").select("entry_date,training_status,recovery_status,adherence_status,new_issue,body_weight_kg").eq("user_id", userId).order("entry_date", { ascending:false }).limit(5),
  ]);
  const summary = (summaryRaw ?? {}) as Summary;
  return <AppShell>
    <div className="topline">Progress · 30 days</div><h1 style={{fontSize:"3.4rem"}}>Low-friction by default</h1>
    <div className="grid">
      <div className="card"><div className="kicker">Latest Weight</div><div className="metric">{summary.latest_weight_kg ?? "–"} {summary.latest_weight_kg ? "kg" : ""}</div><p>Change: {summary.weight_change_kg ?? "–"} kg</p></div>
      <div className="card"><div className="kicker">Training Done</div><div className="metric cyan">{summary.training_completed_count ?? 0}</div><p>Better {summary.training_better_count ?? 0} · Same {summary.training_same_count ?? 0} · Worse {summary.training_worse_count ?? 0}</p></div>
      <div className="card"><div className="kicker">New Issues</div><div className="metric">{summary.new_issue_count ?? 0}</div><p>{(summary.entries_count ?? 0) < 3 ? "Program Active. Not enough data to analyze yet." : "Use trend, not one noisy entry."}</p></div>
    </div>
    <div style={{marginTop:18}}><ProgressForm userId={userId}/></div>
    {(latest ?? []).length > 0 && <section className="card day"><h2>Recent checks</h2>{latest?.map((x, i)=><div className="exercise" key={`${x.entry_date}-${i}`}><div><strong>{x.entry_date}</strong><br/><small>{x.training_status ?? "No training signal"}</small></div><div>{x.body_weight_kg ? `${x.body_weight_kg} kg` : "–"} · {x.recovery_status ?? "–"} · {x.adherence_status ?? "–"}</div></div>)}</section>}
  </AppShell>;
}
