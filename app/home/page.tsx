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

const valueLabel: Record<string, string> = {
  MUSCLE_GAIN: "เพิ่มกล้ามเนื้อ",
  FAT_LOSS: "ลดไขมัน",
  RECOMPOSITION: "ปรับองค์ประกอบร่างกาย",
  GENERAL_FITNESS: "ฟิตเนสทั่วไป",
  BEGINNER: "เริ่มต้น",
  INTERMEDIATE: "ระดับกลาง",
  EXPERIENCED: "มีประสบการณ์",
  FULL_GYM: "ฟิตเนสครบวงจร",
  LIMITED_GYM: "ฟิตเนสจำกัดอุปกรณ์",
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

export default async function HomePage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบยังเชื่อมต่อไม่สมบูรณ์ กรุณาลองใหม่ภายหลัง</div></AppShell>;
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
    <div className="topline">ข้อมูลพื้นฐาน ({tier})</div><h1>เริ่มจากข้อมูลที่นำไปใช้สร้างโปรแกรมจริง</h1>
    <div className="card"><h2>ยังไม่มีข้อมูลพื้นฐาน</h2><p>เลือกเป้าหมาย จุดเน้น จำนวนวันฝึก ประสบการณ์ อุปกรณ์ และเวลาฝึกต่อครั้งก่อน</p><Link className="btn primary" href="/program/start">เริ่มโปรแกรมของฉัน</Link></div>
  </AppShell>;

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
    <div className="topline">ข้อมูลพื้นฐาน ({tier})</div><h1>{activeProgram ? "โปรแกรมของคุณพร้อมแล้ว" : "ข้อมูลพื้นฐานพร้อมสำหรับสร้างโปรแกรม"}</h1>
    <div className="grid">
      <div className="card"><div className="kicker">เป้าหมาย</div><div className="metric">{valueLabel[String(baseline.goal)] ?? String(baseline.goal)}</div></div>
      <div className="card"><div className="kicker">จุดเน้น</div><div className="metric cyan">{(focusLabel[currentFocus] ?? currentFocus) || "–"}</div></div>
      <div className="card"><div className="kicker">การฝึก</div><div className="metric">{String(baseline.training_days_per_week)} วัน/สัปดาห์</div><p>{training?.session_duration_min ?? "–"} นาที/ครั้ง</p></div>
      <div className="card"><div className="kicker">โปรแกรม</div><div className="metric">{activeProgram ? `v${activeProgram.program_version}` : "ดูตัวอย่าง"}</div><p>{activeProgram ? snapshot.program_family ?? "โปรแกรมปัจจุบัน" : "ยังไม่ได้เปิดใช้งาน"}</p></div>
    </div>
    {pending && <div className="notice warning" style={{marginTop:18}}>ข้อมูลพื้นฐานเปลี่ยนจากโปรแกรมที่ใช้อยู่ โปรแกรมเดิมจะยังคงใช้งานจนกว่าคุณจะเปิดใช้เวอร์ชันใหม่</div>}
    <div className="cta-row">
      {activeProgram ? <Link className="btn primary" href="/program">เปิดโปรแกรมปัจจุบัน</Link> : <Link className="btn primary" href="/program/preview">ดูตัวอย่างโปรแกรม</Link>}
      {pending && <Link className="btn" href="/program/preview">ดูตัวอย่างเวอร์ชันใหม่</Link>}
      {tier === "PRO" && <Link className="btn" href="/physical-consult">Physical Consult</Link>}
      <Link className="btn" href="/progress">ความคืบหน้า</Link>
      <Link className="btn" href="/program/start">อัปเดตข้อมูลพื้นฐาน</Link>
    </div>
  </AppShell>;
}
