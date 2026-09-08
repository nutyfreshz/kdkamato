import { AppShell } from "@/components/app-shell";
import { ConsultRequestForm } from "@/components/consult-request-form";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type Report = {
  report_id: string;
  cycle_key: string;
  period_start: string | null;
  period_end: string | null;
  overall_status: string | null;
  what_changed: string | null;
  training_review: string | null;
  nutrition_review: string | null;
  lab_context: string | null;
  professional_assessment: string | null;
  program_update: string | null;
  next_actions: unknown;
  monitor_items: unknown;
  next_review_date: string | null;
  published_at: string | null;
};

type Meeting = {
  meeting_id: string;
  month_key: string;
  status: string;
  requested_at: string | null;
  entitlement_consumed: boolean;
  user_reason: string | null;
};

function textList(value: unknown) {
  return Array.isArray(value) ? value.map((x) => String(x)).filter(Boolean) : [];
}

export default async function ConsultPage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">Supabase env ยังไม่ถูก inject.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const { data: access } = await supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle();
  const isPro = access?.tier === "PRO";

  if (!isPro) {
    return <AppShell>
      <div className="topline">PRO Consult</div>
      <h1>Professional Longitudinal Review</h1>
      <div className="notice warning">Consult เป็น PRO layer. FREE Program และ Progress history ของคุณยังคงอยู่ และสามารถใช้ต่อเมื่อบัญชีได้รับ PRO entitlement.</div>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="kicker">PRO</div>
        <h2>What unlocks</h2>
        <p>Biweekly Professional Review · Lab context when available · longitudinal Exercise Memory · optional online consult requests.</p>
      </section>
    </AppShell>;
  }

  const [{ data: reportsRaw }, { data: meetingsRaw }] = await Promise.all([
    supabase.from("consult_reports")
      .select("report_id,cycle_key,period_start,period_end,overall_status,what_changed,training_review,nutrition_review,lab_context,professional_assessment,program_update,next_actions,monitor_items,next_review_date,published_at")
      .eq("user_id", userId)
      .eq("report_status", "PUBLISHED")
      .order("published_at", { ascending: false })
      .limit(6),
    supabase.from("consult_meetings")
      .select("meeting_id,month_key,status,requested_at,entitlement_consumed,user_reason")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .limit(6),
  ]);

  const reports = (reportsRaw ?? []) as Report[];
  const meetings = (meetingsRaw ?? []) as Meeting[];
  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).format(new Date()).slice(0,7);
  const usedThisMonth = meetings.filter((m) => m.month_key === currentMonth && m.entitlement_consumed).length;

  return <AppShell>
    <div className="topline">PRO Consult</div>
    <h1>Professional Longitudinal Review</h1>
    <div className="grid">
      <div className="card"><div className="kicker">Tier</div><div className="metric cyan">PRO</div><p>Same Program history, deeper longitudinal layer.</p></div>
      <div className="card"><div className="kicker">Online Consult</div><div className="metric">{usedThisMonth}/2</div><p>entitlements used this calendar month</p></div>
      <div className="card"><div className="kicker">Published Reviews</div><div className="metric">{reports.length}</div><p>latest reports visible here</p></div>
    </div>

    <div style={{ marginTop: 18 }}><ConsultRequestForm /></div>

    {reports.length === 0 ? <div className="notice" style={{ marginTop: 18 }}>ยังไม่มี Professional Report ที่ publish แล้ว. Pilot review จะปรากฏที่นี่หลังผ่าน Professional Human Gate.</div> : reports.map((r) => {
      const actions = textList(r.next_actions);
      const monitor = textList(r.monitor_items);
      return <section className="card day" key={r.report_id}>
        <div className="kicker">{r.period_start ?? ""} → {r.period_end ?? ""}</div>
        <h2>{r.overall_status ?? "Professional Review"}</h2>
        {r.what_changed && <p><strong>What changed:</strong> {r.what_changed}</p>}
        {r.training_review && <p><strong>Training:</strong> {r.training_review}</p>}
        {r.nutrition_review && <p><strong>Nutrition:</strong> {r.nutrition_review}</p>}
        {r.lab_context && <p><strong>Lab context:</strong> {r.lab_context}</p>}
        {r.professional_assessment && <p><strong>Assessment:</strong> {r.professional_assessment}</p>}
        {r.program_update && <p><strong>Program update:</strong> {r.program_update}</p>}
        {actions.length > 0 && <p><strong>Next:</strong> {actions.join(" · ")}</p>}
        {monitor.length > 0 && <p><strong>Monitor:</strong> {monitor.join(" · ")}</p>}
        {r.next_review_date && <small>Next review: {r.next_review_date}</small>}
      </section>;
    })}

    {meetings.length > 0 && <section className="card day">
      <div className="kicker">Online Consult History</div>
      <h2>Requests</h2>
      {meetings.map((m) => <div className="exercise" key={m.meeting_id}><div><strong>{m.month_key}</strong><br/><small>{m.user_reason || "No reason added"}</small></div><div>{m.status} · {m.entitlement_consumed ? "USED" : "NOT USED"}</div></div>)}
    </section>}
  </AppShell>;
}
