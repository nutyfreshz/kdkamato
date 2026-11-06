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

type TodayGuidance = {
  items?: Array<{
    item_id?: string;
    today_log?: unknown;
  }> | null;
};

type ProgressEntry = {
  entry_date: string;
  body_weight_kg: number | null;
};

const valueLabel: Record<string, string> = {
  MUSCLE_GAIN: "เพิ่มกล้ามเนื้อ",
  FAT_LOSS: "ลดไขมัน",
  RECOMPOSITION: "ลดไขมันและเพิ่มกล้ามเนื้อ",
  GENERAL_FITNESS: "ดูแลความฟิตโดยรวม",
  BEGINNER: "เริ่มต้น",
  INTERMEDIATE: "ระดับกลาง",
  EXPERIENCED: "มีประสบการณ์",
  FULL_GYM: "ฟิตเนสที่มีอุปกรณ์ครบ",
  LIMITED_GYM: "ฟิตเนสที่มีอุปกรณ์จำกัด",
  HOME_BASIC: "อุปกรณ์พื้นฐานที่บ้าน",
};

const focusLabel: Record<string, string> = {
  CHEST: "อก",
  BACK: "หลัง",
  SHOULDERS: "หัวไหล่",
  ARMS: "แขน",
  LEGS: "ขา",
  QUADS: "ต้นขาด้านหน้า",
  HAMSTRINGS: "ต้นขาด้านหลัง",
  GLUTES: "ก้น",
  BALANCED: "สมดุลทั้งร่างกาย",
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

function bangkokDate(offsetDays = 0) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offsetDays * 86400000));
}

function reviewText(nextReviewAt?: string | null) {
  if (!nextReviewAt) return "ระบบจะกำหนดรอบทบทวนเมื่อข้อมูล PRO พร้อม";
  const diffDays = Math.ceil((new Date(nextReviewAt).getTime() - Date.now()) / 86400000);
  if (diffDays <= 0) return "ถึงรอบทบทวน PRO แล้ว ระบบจะประเมินให้อัตโนมัติ";
  if (diffDays === 1) return "ระบบจะทบทวน PRO ครั้งถัดไปประมาณพรุ่งนี้";
  return `ระบบจะทบทวน PRO ครั้งถัดไปในอีกประมาณ ${diffDays} วัน`;
}

export default async function HomePage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ยังเชื่อมต่อระบบไม่ได้ กรุณาลองใหม่ภายหลัง</div></AppShell>;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน</div></AppShell>;

  const [{ data: baseline }, { data: training }, { data: access }, { data: activeProgram }] = await Promise.all([
    supabase.from("user_baseline").select("goal,training_experience,training_days_per_week,equipment_profile,weight_kg").eq("user_id", userId).maybeSingle(),
    supabase.from("training_profiles").select("session_duration_min,priority_muscles").eq("user_id", userId).maybeSingle(),
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version,goal_snapshot").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);

  const tier = access?.tier ?? "FREE";
  if (!baseline) return <AppShell>
    <div className="topline">ข้อมูลพื้นฐาน ({tier})</div><h1>กรอกข้อมูลเพื่อสร้างโปรแกรมที่เหมาะกับคุณ</h1>
    <div className="card"><h2>ยังไม่มีข้อมูลพื้นฐาน</h2><p>เลือกเป้าหมาย กล้ามเนื้อที่อยากเน้น จำนวนวันฝึก ประสบการณ์ อุปกรณ์ และเวลาต่อครั้ง</p><Link className="btn primary" href="/program/start">เริ่มสร้างโปรแกรม</Link></div>
  </AppShell>;

  const today = bangkokDate();
  const sevenDaysAgo = bangkokDate(-6);

  const [guidanceResult, progressResult, proProfileResult] = await Promise.all([
    activeProgram ? supabase.rpc("get_my_free_training_guidance") : Promise.resolve({ data: null }),
    supabase.from("progress_entries")
      .select("entry_date,body_weight_kg")
      .eq("user_id", userId)
      .gte("entry_date", sevenDaysAgo)
      .lte("entry_date", today)
      .order("entry_date", { ascending: true }),
    tier === "PRO"
      ? supabase.from("pro_profiles").select("next_review_at,review_state").eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const guidance = (guidanceResult.data ?? null) as TodayGuidance | null;
  const progressEntries = (progressResult.data ?? []) as ProgressEntry[];
  const proProfile = proProfileResult.data as { next_review_at?: string | null; review_state?: string | null } | null;

  const workoutLoggedCount = (guidance?.items ?? []).filter((item) => Boolean(item.today_log)).length;
  const checkedInToday = progressEntries.some((entry) => entry.entry_date === today);
  const checkIns7d = progressEntries.length;
  const weights7d = progressEntries.filter((entry) => entry.body_weight_kg != null).length;
  const checkInEnough = checkIns7d >= 2;
  const weightEnough = weights7d >= 3;

  const snapshot = (activeProgram?.goal_snapshot ?? {}) as GoalSnapshot;
  const currentFocus = focusFromProfile(training?.priority_muscles);
  const pending = Boolean(activeProgram) && (
    snapshot.goal !== baseline.goal ||
    snapshot.training_experience !== baseline.training_experience ||
    Number(snapshot.training_days_per_week) !== Number(baseline.training_days_per_week) ||
    snapshot.equipment_profile !== baseline.equipment_profile ||
    snapshot.primary_focus !== currentFocus ||
    Number(snapshot.session_duration_min) !== Number(training?.session_duration_min)
  );

  return <AppShell>
    <div className="topline">{tier} · วันนี้</div>
    <h1>วันนี้ควรทำอะไรบ้าง</h1>
    <p>บันทึกเฉพาะวันที่มีข้อมูลใหม่ ระบบจะใช้ผลฝึกและเช็กอินของคุณประกอบคำแนะนำ</p>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">TODAY</div>
      <h2>{workoutLoggedCount > 0 ? "วันนี้มีข้อมูลการฝึกแล้ว" : "วันนี้ควรทำอะไร"}</h2>
      <div className="grid" style={{ marginTop: 12 }}>
        <div>
          <strong>การฝึก</strong>
          {activeProgram ? (
            workoutLoggedCount > 0
              ? <p style={{ marginBottom: 0 }}>วันนี้บันทึกแล้ว {workoutLoggedCount} ท่า ระบบจะใช้ผลนี้ประกอบคำแนะนำครั้งถัดไป ไม่ต้องกรอกซ้ำ</p>
              : <p style={{ marginBottom: 0 }}>ถ้าวันนี้ฝึก ให้เปิดโปรแกรมและบันทึกผลแต่ละท่า วันพักไม่ต้องบันทึกการฝึก</p>
          ) : <p style={{ marginBottom: 0 }}>ยังไม่มีโปรแกรมปัจจุบัน สร้างโปรแกรมก่อนเริ่มบันทึกผลฝึก</p>}
        </div>
        <div><strong>เช็กอินและน้ำหนัก</strong> {checkedInToday ? (
            <p style={{ marginBottom: 0 }}>วันนี้เช็กอินแล้ว สัปดาห์นี้มีเช็กอิน {checkIns7d} ครั้ง และบันทึกน้ำหนัก {weights7d} ครั้ง</p>
          ) : checkInEnough && weightEnough ? (
            <p style={{ marginBottom: 0 }}>ข้อมูลสัปดาห์นี้เพียงพอแล้ว วันนี้ไม่ต้องเช็กอินเพิ่ม</p>
          ) : (
            <p style={{ marginBottom: 0 }}>สัปดาห์นี้เช็กอิน {checkIns7d}/2+ ครั้ง และบันทึกน้ำหนัก {weights7d}/3+ ครั้ง บันทึกเพิ่มเมื่อสะดวก ไม่ต้องทำทุกวัน</p>
          )}</div>
        <div>
          <strong>{tier === "PRO" ? "PRO" : "FREE"}</strong>
          {tier === "PRO" ? (
            <p style={{ marginBottom: 0 }}>{reviewText(proProfile?.next_review_at)} · บันทึกความรู้สึกรายท่าเมื่อสังเกตเห็นความเปลี่ยนแปลง ไม่จำเป็นต้องกรอกทุกท่า</p>
          ) : (
            <p style={{ marginBottom: 0 }}>FREE ใช้ผลที่บันทึกเพื่อแนะนำว่าครั้งถัดไปควรเพิ่ม คง หรือลดความหนัก วันพักไม่จำเป็นต้องเปิดแอป</p>
          )}
        </div>
      </div>
      <div className="cta-row" style={{ marginTop: 14 }}>
        {activeProgram ? <Link className="btn primary" href="/program">เปิด โปรแกรม</Link> : <Link className="btn primary" href="/program/start">สร้าง โปรแกรม</Link>}
        {!checkedInToday && (!checkInEnough || !weightEnough) && <Link className="btn" href="/progress">เช็กอินวันนี้</Link>}
        {tier === "PRO" && <Link className="btn" href="/consult">ดูผลทบทวน PRO</Link>}
      </div>
    </section>

    <div className="topline" style={{ marginTop: 28 }}>ข้อมูลพื้นฐาน ({tier})</div>
    <h2>{activeProgram ? "โปรแกรมปัจจุบัน" : "ข้อมูลพร้อมสร้างโปรแกรมแล้ว"}</h2>
    <div className="grid">
      <div className="card"><div className="kicker">เป้าหมาย</div><div className="metric">{valueLabel[String(baseline.goal)] ?? String(baseline.goal)}</div></div>
      <div className="card"><div className="kicker">จุดเน้น</div><div className="metric cyan">{(focusLabel[currentFocus] ?? currentFocus) || "–"}</div></div>
      <div className="card"><div className="kicker">การฝึก</div><div className="metric">{String(baseline.training_days_per_week)} วัน/สัปดาห์</div><p>{training?.session_duration_min ?? "–"} นาที/ครั้ง</p></div>
      <div className="card"><div className="kicker">Program</div><div className="metric">{activeProgram ? `v${activeProgram.program_version}` : "ดูตัวอย่าง"}</div><p>{activeProgram ? snapshot.program_family ?? "โปรแกรมปัจจุบัน" : "ยังไม่ได้เปิดใช้งาน"}</p></div>
    </div>

    {pending && <div className="notice warning" style={{marginTop:18}}>ข้อมูลตั้งค่าเปลี่ยนไปแล้ว โปรแกรมเดิมยังใช้ต่อได้จนกว่าคุณจะเปิดใช้เวอร์ชันใหม่</div>}

    <div className="cta-row">
      {activeProgram ? <Link className="btn primary" href="/program">เปิด โปรแกรมปัจจุบัน</Link> : <Link className="btn primary" href="/program/preview">ดูตัวอย่าง โปรแกรม</Link>}
      {pending && <Link className="btn" href="/program/preview">ดูตัวอย่างเวอร์ชันใหม่</Link>}
      {tier === "PRO" && <Link className="btn" href="/physical-consult">Physical Consult</Link>}
      <Link className="btn" href="/progress">ความก้าวหน้า</Link>
      <Link className="btn" href="/program/start">อัปเดตข้อมูลพื้นฐาน</Link>
    </div>
  </AppShell>;
}
