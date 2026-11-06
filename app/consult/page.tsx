import { AppShell } from "@/components/app-shell";
import { ConsultRequestForm } from "@/components/consult-request-form";
import { requireUser } from "@/lib/supabase/auth";
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

const meetingStatusLabel: Record<string, string> = {
  REQUESTED: "ส่งคำขอแล้ว",
  SCHEDULED: "นัดหมายแล้ว",
  COMPLETED: "เสร็จแล้ว",
  CANCELED: "ยกเลิกแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
};

const reportStatusLabel: Record<string, string> = {
  STABLE: "คงที่",
  ADAPT: "ควรปรับ",
  MONITOR: "ติดตามต่อ",
  REVIEW_REQUIRED: "ต้องทบทวน",
  "EARLY POSITIVE · LIMITED DATA": "เริ่มเห็นแนวโน้มที่ดี แต่ข้อมูลยังไม่พอ",
  EARLY_POSITIVE_LIMITED_DATA: "เริ่มเห็นแนวโน้มที่ดี แต่ข้อมูลยังไม่พอ",
};

const reportTextLabel: Record<string, string> = {
  "PRO access is active and the first real exercise-specific response was captured. Machine Chest Press was reported BETTER with GOOD tolerance, OK recovery, and NEUTRAL preference.":
    "เปิดใช้ PRO และมีผลฝึกครั้งแรกแล้ว: Machine Chest Press ทำได้ดีขึ้น รู้สึกสบายกับท่า ฟื้นตัวพอใช้ และยังรู้สึกเฉย ๆ กับท่านี้",
  "The first exercise response is positive and Exercise Memory is now TRY. This is not enough longitudinal evidence to confirm a good-fit exercise or justify changing the program.":
    "ผลครั้งแรกเป็นบวก ประวัติรายท่าระบุว่าควรลองต่อ แต่ยังต้องเก็บข้อมูลเพิ่มก่อนสรุปว่าท่านี้เหมาะหรือปรับโปรแกรม",
  "Only one progress entry is available in the current review window, so body-weight and nutrition response trends are not yet interpretable.":
    "มีเช็กอินเพียง 1 ครั้ง จึงยังดูแนวโน้มน้ำหนักและผลด้านอาหารไม่ได้",
  "No saved KDKAMATO Lab result is available in this review window. Current exercise evidence therefore comes from actual observed response rather than Lab prediction.":
    "รอบนี้ยังไม่มีผล LAB ที่บันทึก ข้อมูลท่าฝึกที่ใช้จึงมาจากผลฝึกจริง",
  "Keep the current program unchanged. Evidence is currently positive but limited, so additional real training response should be collected before any material decision.":
    "ใช้โปรแกรมเดิมต่อก่อน ผลเริ่มเป็นบวกแต่ข้อมูลยังน้อย ควรเก็บผลฝึกเพิ่มก่อนเปลี่ยนแผนหลัก",
  "Continue the current program without a material change.":
    "ใช้โปรแกรมปัจจุบันต่อ ยังไม่ต้องปรับแผนหลัก",
  "Keep logging simple exercise feedback and Progress checks after real training sessions.":
    "บันทึกผลรายท่าสั้น ๆ และเช็กอินหลังฝึกอย่างต่อเนื่อง",
  "Machine Chest Press response across additional sessions":
    "ผลตอบสนองต่อ Machine Chest Press ในครั้งถัด ๆ ไป",
  "Training performance, recovery and adherence trend":
    "แนวโน้มผลการฝึก การฟื้นตัว และความสม่ำเสมอ",
  "Body-weight trend as more Progress checks accumulate":
    "แนวโน้มน้ำหนักตัวเมื่อมีข้อมูลความก้าวหน้าเพิ่มขึ้น",
};

function displayReportText(value: string | null) {
  if (!value) return null;
  return reportTextLabel[value] ?? value;
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.map((x) => String(x)).filter(Boolean) : [];
}

export default async function ConsultPage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ยังเชื่อมต่อระบบไม่ได้ กรุณาลองใหม่ภายหลัง</div></AppShell>;
  const user = await requireUser();
  if (!user) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน</div></AppShell>;

  const supabase = await createClient();
  const userId = user.id;
  const { data: access } = await supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle();
  const isPro = access?.tier === "PRO";

  if (!isPro) {
    return <AppShell>
      <div className="topline">PRO Review</div>
      <h1>การทบทวนโดย PRO</h1>
      <div className="notice warning">การทบทวนโปรแกรมเป็นฟีเจอร์ PRO ประวัติโปรแกรมและความก้าวหน้าจาก FREE ยังเก็บไว้และใช้ต่อได้เมื่อได้รับสิทธิ์ PRO</div>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="kicker">PRO</div>
        <h2>สิ่งที่เพิ่มขึ้นใน PRO</h2>
        <p>ทบทวนทุก 2 สัปดาห์ ใช้ผล LAB ที่เกี่ยวข้องและประวัติรายท่าระยะยาว พร้อมขอปรึกษาออนไลน์เพิ่มเติมได้</p>
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
    <div className="topline">PRO Review</div>
    <h1>การทบทวนโดย PRO</h1>
    <p>PRO พิจารณาความก้าวหน้า ผลฝึก ประวัติรายท่า ผล LAB และประวัติโปรแกรมร่วมกัน ก่อนแนะนำให้คงหรือปรับแผน</p>
    <div className="grid">
      <div className="card"><div className="kicker">ระดับบัญชี</div><div className="metric cyan">PRO</div><p>ใช้ประวัติโปรแกรมเดิมต่อ พร้อมติดตามข้อมูลระยะยาวได้ละเอียดขึ้น</p></div>
      <div className="card"><div className="kicker">การปรึกษาออนไลน์</div><div className="metric">{usedThisMonth}/2</div><p>สิทธิ์ที่ใช้ไปในเดือนนี้</p></div>
      <div className="card"><div className="kicker">รายงาน PRO</div><div className="metric">{reports.length}</div><p>รายงานล่าสุดที่แสดงในหน้านี้</p></div>
    </div>

    <div style={{ marginTop: 18 }}><ConsultRequestForm /></div>

    {reports.length === 0 ? <div className="notice" style={{ marginTop: 18 }}>ยังไม่มีรายงาน PRO เมื่อทบทวนรอบนี้เสร็จ รายงานจะแสดงที่นี่</div> : reports.map((r) => {
      const actions = textList(r.next_actions).map((item) => displayReportText(item) ?? item);
      const monitor = textList(r.monitor_items).map((item) => displayReportText(item) ?? item);
      const status = r.overall_status ? reportStatusLabel[r.overall_status] ?? r.overall_status : "รายงาน PRO";
      return <section className="card day" key={r.report_id}>
        <div className="kicker">{r.period_start ?? ""} → {r.period_end ?? ""}</div>
        <h2>{status}</h2>
        {r.what_changed && <p><strong>สิ่งที่เปลี่ยน:</strong> {displayReportText(r.what_changed)}</p>}
        {r.training_review && <p><strong>การฝึก:</strong> {displayReportText(r.training_review)}</p>}
        {r.nutrition_review && <p><strong>โภชนาการ:</strong> {displayReportText(r.nutrition_review)}</p>}
        {r.lab_context && <p><strong>ข้อมูล LAB ที่เกี่ยวข้อง:</strong> {displayReportText(r.lab_context)}</p>}
        {r.professional_assessment && <p><strong>การประเมินโดยผู้เชี่ยวชาญ:</strong> {displayReportText(r.professional_assessment)}</p>}
        {r.program_update && <p><strong>การปรับ โปรแกรม:</strong> {displayReportText(r.program_update)}</p>}
        {actions.length > 0 && <p><strong>ทำต่อ:</strong> {actions.join(" · ")}</p>}
        {monitor.length > 0 && <p><strong>ติดตาม:</strong> {monitor.join(" · ")}</p>}
        {r.next_review_date && <small>ทบทวนครั้งถัดไป: {r.next_review_date}</small>}
      </section>;
    })}

    {meetings.length > 0 && <section className="card day">
      <div className="kicker">ประวัติการปรึกษาออนไลน์</div>
      <h2>คำขอปรึกษา</h2>
      {meetings.map((m) => <div className="exercise" key={m.meeting_id}><div><strong>{m.month_key}</strong><br/><small>{m.user_reason || "ไม่ได้ระบุเหตุผล"}</small></div><div>{meetingStatusLabel[m.status] ?? m.status} · {m.entitlement_consumed ? "ใช้สิทธิ์แล้ว" : "ยังไม่ใช้สิทธิ์"}</div></div>)}
    </section>}
  </AppShell>;
}
