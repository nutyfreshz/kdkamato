import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PhysicalConsultProgramAccordion } from "@/components/physical-consult-program-accordion";
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
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลไม่พร้อมใช้งานชั่วคราว</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน</div></AppShell>;

  const [{ data: access }, { data: program }] = await Promise.all([
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);
  if (access?.tier !== "PRO") return <AppShell><div className="notice warning">Physical Consult และ Exercise Memory ใช้ได้กับบัญชี PRO</div></AppShell>;
  if (!program) return <AppShell>
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><Link href="/physical-consult">ประเมินกับเทรนเนอร์</Link><span>›</span><span>บันทึกผลรายท่า</span></div>
    <div className="topline">Physical Consult · Program ปัจจุบัน</div>
    <h1>ยังไม่มี Program ปัจจุบัน</h1>
    <div className="cta-row"><Link className="btn" href="/physical-consult">กลับสู่ Physical Consult</Link><Link className="btn primary" href="/program/start">สร้าง Program</Link></div>
  </AppShell>;

  const today = bangkokDate();
  const [{ data: itemsRaw }, { data: feedbackRaw }] = await Promise.all([
    supabase.from("training_program_items").select("item_id,training_day,display_order,exercise_key,metadata").eq("program_id", program.program_id).order("training_day").order("display_order"),
    supabase.from("exercise_response_entries").select("exercise_key,performance_status,tolerance_status,recovery_status,preference_status,optional_note").eq("user_id", userId).eq("program_id", program.program_id).eq("entry_date", today),
  ]);
  const items = (itemsRaw ?? []) as ProgramItem[];
  const feedback = (feedbackRaw ?? []) as FeedbackRow[];
  const completedCount = feedback.filter((row) => row.performance_status || row.tolerance_status || row.recovery_status || row.preference_status || row.optional_note).length;

  return <AppShell>
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><Link href="/physical-consult">ประเมินกับเทรนเนอร์</Link><span>›</span><span>บันทึกผลรายท่า</span></div>
    <div className="topline">PRO · Physical Consult · Program v{program.program_version}</div>
    <h1>บันทึกผลจาก Program</h1>
    <p>เลือกเฉพาะท่าที่ต้องการประเมิน ไม่ต้องกรอกทุกท่า</p>
    <div className="notice" style={{ marginBottom: 18 }}>
      <strong>บันทึกวันนี้แล้ว {completedCount}/{items.length} ท่า</strong>
      <p style={{ marginBottom: 0 }}>แตะท่าที่ต้องการบันทึก · ผลการฝึกจริงจะมีน้ำหนักมากกว่าคำคาดการณ์จาก LAB</p>
    </div>

    <PhysicalConsultProgramAccordion items={items} feedback={feedback} />

    <div className="cta-row" style={{ marginTop: 18 }}>
      <Link className="btn primary" href="/physical-consult">กลับสู่ Physical Consult</Link>
      <Link className="btn" href="/program">ดู Program แบบเต็ม</Link>
    </div>
  </AppShell>;
}
