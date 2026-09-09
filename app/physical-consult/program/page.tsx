import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExerciseFeedbackForm } from "@/components/exercise-feedback-form";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type ProgramItem = {
  item_id: string;
  training_day: number;
  display_order: number;
  exercise_key: string;
  metadata: { display_name?: string; day_label?: string; target_label?: string } | null;
};
type FeedbackRow = {
  exercise_key: string;
  performance_status: string | null;
  tolerance_status: string | null;
  recovery_status: string | null;
  preference_status: string | null;
  optional_note: string | null;
};

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function PhysicalConsultProgramPage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const [{ data: access }, { data: program }] = await Promise.all([
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);
  if (access?.tier !== "PRO") return <AppShell><div className="notice warning">Physical Consult Exercise Memory ใช้กับ PRO account.</div></AppShell>;
  if (!program) return <AppShell>
    <div className="topline">Physical Consult · Active Program</div>
    <h1>ยังไม่มี Active Program</h1>
    <div className="cta-row"><Link className="btn" href="/physical-consult">กลับ Physical Consult</Link><Link className="btn primary" href="/program/start">สร้าง Program</Link></div>
  </AppShell>;

  const today = bangkokDate();
  const [{ data: itemsRaw }, { data: feedbackRaw }] = await Promise.all([
    supabase.from("training_program_items").select("item_id,training_day,display_order,exercise_key,metadata").eq("program_id", program.program_id).order("training_day").order("display_order"),
    supabase.from("exercise_response_entries").select("exercise_key,performance_status,tolerance_status,recovery_status,preference_status,optional_note").eq("user_id", userId).eq("program_id", program.program_id).eq("entry_date", today),
  ]);
  const items = (itemsRaw ?? []) as ProgramItem[];
  const feedbackMap = new Map<string, FeedbackRow>(((feedbackRaw ?? []) as FeedbackRow[]).map((x) => [x.exercise_key, x]));
  const byDay = items.reduce<Map<number, ProgramItem[]>>((acc, item) => {
    const list = acc.get(item.training_day) ?? [];
    list.push(item);
    acc.set(item.training_day, list);
    return acc;
  }, new Map<number, ProgramItem[]>());

  return <AppShell>
    <div className="topline">PRO · Physical Consult · Program v{program.program_version}</div>
    <h1>Active Program Feedback</h1>
    <p>หน้านี้เปิดเฉพาะสิ่งที่ Trainer ต้องใช้ระหว่าง consult: ท่าใน Active Program และช่องบันทึก actual response โดยตรง.</p>
    <div className="notice" style={{ marginBottom: 18 }}>
      <strong>กรอกเฉพาะสิ่งที่สังเกตได้จริง</strong>
      <p style={{ marginBottom: 0 }}>ไม่จำเป็นต้องกรอกทุกช่องหรือทุกท่า. Actual response จะถูกใช้ใน Exercise Memory และมี priority สูงกว่า LAB prediction.</p>
    </div>

    {Array.from(byDay.entries()).map(([day, dayItems]) => <section className="card day" key={day} style={{ marginTop: 18 }}>
      <div className="kicker">DAY {day}</div>
      <h2>{dayItems[0]?.metadata?.day_label ?? `Day ${day}`}</h2>
      {dayItems.map((item) => {
        const label = item.metadata?.display_name ?? item.exercise_key;
        return <div key={item.item_id} style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14, marginTop: 14 }}>
          <strong>{label}</strong><br/>
          <small>{item.metadata?.target_label ?? "Training movement"}</small>
          <ExerciseFeedbackForm exerciseKey={item.exercise_key} label={label} initial={feedbackMap.get(item.exercise_key) ?? null} />
        </div>;
      })}
    </section>)}

    <div className="cta-row" style={{ marginTop: 18 }}>
      <Link className="btn primary" href="/physical-consult">กลับ Physical Consult Session</Link>
      <Link className="btn" href="/program">ดู Program เต็ม</Link>
    </div>
  </AppShell>;
}
