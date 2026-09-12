import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ActivateProgramButton } from "@/components/activate-program-button";
import { ProgramWeek } from "@/components/program-week";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export const metadata = { title: "ตัวอย่างโปรแกรม" };

const EXPECTED_ENGINE_VERSION = "FREE_ENGINE_V1.2";
const EXPECTED_CONTRACT_VERSION = "FREE_PROGRAM_CONTRACT_V1";

type ProgressionRule = {
  trigger?: string;
  action?: string;
  increment_pct_low?: number | null;
  increment_pct_high?: number | null;
};

type PreviewItem = {
  training_day: number;
  exercise_key: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  target_rir: number;
  display_order: number;
  metadata?: {
    display_name?: string;
    day_label?: string;
    target_label?: string;
    primary_muscle?: string;
    focus_boost?: boolean;
    alternative_name?: string | null;
    progression?: ProgressionRule;
  } | null;
};

type GoalSnapshot = {
  goal: string;
  training_experience: string;
  training_days_per_week: number;
  equipment_profile: string;
  primary_focus: string;
  focus_label: string;
  session_duration_min: number;
};

type PreviewData = {
  contract_version: string;
  program_fingerprint: string;
  engine_version: string;
  family: string;
  focus: string;
  focus_label: string;
  days: number;
  session_duration_min: number;
  training_items: PreviewItem[];
  weekly_volume: Record<string, number>;
  goal_snapshot: GoalSnapshot;
  energy_estimate?: { confidence?: string | null; basis?: string | null; missing_inputs?: string[] };
  nutrition_target: {
    maintenance_low: number | null;
    maintenance_high: number | null;
    calorie_low: number | null;
    calorie_high: number | null;
    protein_low_g: number | null;
    protein_high_g: number | null;
    estimate_confidence: string | null;
  };
};

const muscleLabel: Record<string, string> = {
  CHEST: "อก", BACK: "หลัง", QUADS: "ต้นขาด้านหน้า", HAMSTRINGS: "ต้นขาด้านหลัง", SHOULDERS: "หัวไหล่",
  BICEPS: "ไบเซปส์", TRICEPS: "ไตรเซปส์", CALVES: "น่อง", CORE: "แกนกลางลำตัว", ROTATOR_CUFF: "กล้ามเนื้อรอบหัวไหล่", LOWER_TRAP: "หลังส่วนบน / สะบัก",
};

const valueLabel: Record<string, string> = {
  MUSCLE_GAIN: "เพิ่มกล้ามเนื้อ", FAT_LOSS: "ลดไขมัน", RECOMPOSITION: "ปรับองค์ประกอบร่างกาย", GENERAL_FITNESS: "ฟิตเนสทั่วไป",
  BEGINNER: "เริ่มต้น", INTERMEDIATE: "ระดับกลาง", EXPERIENCED: "มีประสบการณ์",
  FULL_GYM: "ฟิตเนสครบวงจร", LIMITED_GYM: "ฟิตเนสจำกัดอุปกรณ์", HOME_BASIC: "อุปกรณ์พื้นฐานที่บ้าน",
};

function progressionText(item: PreviewItem) {
  const p = item.metadata?.progression;
  if (!p?.trigger || !p.action) return null;
  return `${p.trigger} → ${p.action}`;
}

async function edgeErrorPayload(error: unknown) {
  if (!error || typeof error !== "object" || !("context" in error)) return null;
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return null;
  try {
    return await context.clone().json() as { error?: string; fields?: string[]; detail?: unknown };
  } catch {
    return null;
  }
}

function validPreview(data: unknown): data is PreviewData {
  if (!data || typeof data !== "object") return false;
  const x = data as Partial<PreviewData>;
  if (x.contract_version !== EXPECTED_CONTRACT_VERSION) return false;
  if (x.engine_version !== EXPECTED_ENGINE_VERSION) return false;
  if (typeof x.program_fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(x.program_fingerprint)) return false;
  if (typeof x.family !== "string" || typeof x.focus !== "string" || typeof x.focus_label !== "string") return false;
  if (!Number.isInteger(Number(x.days)) || Number(x.days) < 2 || Number(x.days) > 6) return false;
  if (![45, 60, 75, 90].includes(Number(x.session_duration_min))) return false;
  if (!Array.isArray(x.training_items) || x.training_items.length === 0) return false;
  if (!x.weekly_volume || typeof x.weekly_volume !== "object") return false;
  if (!x.nutrition_target || typeof x.nutrition_target !== "object") return false;
  if (!x.goal_snapshot || typeof x.goal_snapshot !== "object") return false;
  if (x.goal_snapshot.primary_focus !== x.focus) return false;
  if (x.goal_snapshot.focus_label !== x.focus_label) return false;
  if (Number(x.goal_snapshot.training_days_per_week) !== Number(x.days)) return false;
  if (Number(x.goal_snapshot.session_duration_min) !== Number(x.session_duration_min)) return false;
  return true;
}

export default async function ProgramPreviewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!hasSupabaseEnv()) return <AppShell>
    <div className="topline">ตัวอย่างโปรแกรม</div>
    <h1>ยังแสดงตัวอย่างโปรแกรมไม่ได้</h1>
    <div className="notice warning">ระบบเชื่อมต่อข้อมูลไม่พร้อมใช้งานชั่วคราว</div>
    <div className="cta-row"><Link className="btn" href="/home">กลับหน้าแรก</Link></div>
  </AppShell>;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell>
    <div className="topline">ตัวอย่างโปรแกรม</div>
    <h1>กรุณาเข้าสู่ระบบก่อน</h1>
    <div className="cta-row"><Link className="btn primary" href="/login">เข้าสู่ระบบ</Link></div>
  </AppShell>;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return <AppShell>
    <div className="topline">ตัวอย่างโปรแกรม</div>
    <h1>เซสชันหมดอายุ</h1>
    <div className="notice warning">เข้าสู่ระบบใหม่เพื่อดูตัวอย่างโปรแกรมต่อ</div>
    <div className="cta-row"><Link className="btn primary" href="/login">เข้าสู่ระบบ</Link></div>
  </AppShell>;

  const { data, error } = await supabase.functions.invoke("kdk-free-program", {
    body: { mode: "preview" },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error || !data) {
    const payload = await edgeErrorPayload(error);
    const code = payload?.error ?? "UNKNOWN_ERROR";
    if (code === "BASELINE_REQUIRED" || code === "FOUNDATION_INVALID") {
      return <AppShell>
        <div className="topline">ต้องตั้งค่าโปรแกรมก่อน</div>
        <h1>ยังแสดงตัวอย่างโปรแกรมไม่ได้</h1>
        <div className="notice warning">{code === "BASELINE_REQUIRED" ? "ยังไม่มีข้อมูลสำหรับสร้างโปรแกรม" : "ข้อมูลตั้งค่ายังไม่ครบหรือไม่ผ่านการตรวจสอบ"}</div>
        <div className="cta-row"><Link className="btn primary" href="/program/start">ตรวจสอบการตั้งค่า</Link></div>
      </AppShell>;
    }
    if (code === "ENGINE_VERSION_MISMATCH" || code === "PROGRAM_CONTRACT_INCONSISTENT" || code === "PROGRAM_VALIDATION_FAILED") {
      return <AppShell>
        <div className="topline">การตรวจสอบความถูกต้องของระบบ</div>
        <h1>ยังเปิดใช้ตัวอย่างนี้ไม่ได้</h1>
        <div className="notice warning">ระบบตรวจพบว่าข้อมูลสำหรับสร้างโปรแกรมไม่สอดคล้องกัน จึงยังไม่อนุญาตให้เปิดใช้เวอร์ชันนี้</div>
        <div className="cta-row"><Link className="btn" href="/program">กลับไปโปรแกรมปัจจุบัน</Link></div>
      </AppShell>;
    }
    return <AppShell>
      <div className="topline">ตัวอย่างโปรแกรม</div>
      <h1>ยังแสดงตัวอย่างโปรแกรมไม่ได้</h1>
      <div className="notice warning">ลองเปิดหน้านี้อีกครั้ง หรือกลับไปตรวจสอบการตั้งค่า</div>
      <div className="cta-row"><Link className="btn primary" href="/program/preview">ลองเปิดหน้านี้อีกครั้ง</Link><Link className="btn" href="/program/start">ตรวจสอบการตั้งค่า</Link></div>
    </AppShell>;
  }

  if (!validPreview(data)) {
    return <AppShell>
      <div className="topline">การตรวจสอบความถูกต้องของระบบ</div>
      <h1>ยังเปิดใช้ตัวอย่างนี้ไม่ได้</h1>
      <div className="notice warning">ข้อมูลระหว่างหน้าเว็บและระบบคำนวณโปรแกรมไม่ตรงกัน ระบบจะไม่ใช้ค่าทดแทนและจะไม่เปิดใช้โปรแกรมนี้</div>
      <div className="cta-row"><Link className="btn" href="/program">กลับไปโปรแกรมปัจจุบัน</Link></div>
    </AppShell>;
  }

  const preview = data;
  const byDay = preview.training_items.reduce((acc, item) => {
    const items = acc.get(item.training_day) ?? [];
    items.push(item);
    acc.set(item.training_day, items);
    return acc;
  }, new Map<number, PreviewItem[]>());

  const dayLabels = Object.fromEntries(Array.from(byDay.entries()).map(([day, items]) => [day, items[0]?.metadata?.day_label ?? `วันที่ฝึก ${day}`]));
  const energyReady = preview.nutrition_target.maintenance_low != null && preview.nutrition_target.maintenance_high != null;
  const volumeEntries = Object.entries(preview.weekly_volume);
  const snapshot = preview.goal_snapshot;
  const activationError = params.error ? decodeURIComponent(params.error) : null;

  return <AppShell>
    <div className="topline">ตัวอย่างโปรแกรม</div>
    <h1>{preview.family}</h1>
    <p>{valueLabel[snapshot.goal] ?? snapshot.goal} · {valueLabel[snapshot.training_experience] ?? snapshot.training_experience} · {valueLabel[snapshot.equipment_profile] ?? snapshot.equipment_profile} · {preview.focus_label} · {preview.days} วัน · {preview.session_duration_min} นาที</p>
    {activationError && <div className="notice warning" style={{ marginBottom: 16 }}>{activationError === "PREVIEW_STALE" ? "ข้อมูลหรือระบบคำนวณเปลี่ยนหลังจากสร้างตัวอย่างนี้ กรุณาตรวจสอบตัวอย่างล่าสุดแล้วเปิดใช้อีกครั้ง" : "เปิดใช้โปรแกรมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}</div>}

    <div className="grid">
      <div className="card"><div className="kicker">จุดเน้น</div><div className="metric cyan">{preview.focus_label}</div></div>
      <div className="card"><div className="kicker">ตารางฝึก</div><div className="metric">{preview.days} วัน</div><p>{preview.session_duration_min} นาทีต่อครั้ง</p></div>
      <div className="card"><div className="kicker">โปรตีน (กรัม/วัน)</div><div className="metric">{preview.nutrition_target.protein_low_g}–{preview.nutrition_target.protein_high_g} g</div></div>
      <div className="card"><div className="kicker">พลังงาน (กิโลแคลอรี/วัน)</div><div className="metric" style={{ fontSize: "1.15rem" }}>{energyReady ? `${preview.nutrition_target.calorie_low}–${preview.nutrition_target.calorie_high} kcal` : "กำลังปรับเทียบ"}</div><p>{energyReady ? `พลังงานคงน้ำหนัก ${preview.nutrition_target.maintenance_low}–${preview.nutrition_target.maintenance_high}` : "จะแสดงเมื่อข้อมูลที่วัดได้เพียงพอแล้วเท่านั้น"}</p></div>
    </div>

    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">เซตหนักโดยตรงต่อสัปดาห์</div>
      <h2>ปริมาณการฝึกรายสัปดาห์</h2>
      <p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p>
    </section> : null}

    <ProgramWeek days={preview.days} focus={preview.focus} dayLabels={dayLabels} />

    {Array.from(byDay.entries()).map(([day, items]) => {
      const sorted = [...items].sort((a, b) => a.display_order - b.display_order);
      const dayLabel = sorted[0]?.metadata?.day_label ?? `วันที่ฝึก ${day}`;
      return <section className="card day" key={day}>
        <div className="kicker">วันที่ฝึก {day}</div>
        <h2>{dayLabel}</h2>
        {sorted.map((x) => {
          const next = progressionText(x);
          return <div className="exercise" key={`${x.training_day}-${x.display_order}`}>
            <div style={{ minWidth: 0 }}>
              <strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/>
              <small>{x.metadata?.target_label ?? "ท่าฝึก"}{x.metadata?.focus_boost ? " · จุดเน้น" : ""}</small>
              {next ? <p style={{ margin: "6px 0 0", fontSize: ".82rem" }}><strong>ถัดไป:</strong> {next}</p> : null}
              {x.metadata?.alternative_name ? <p style={{ margin: "4px 0 0", fontSize: ".78rem", opacity: .72 }}>ตัวเลือก: {x.metadata.alternative_name}</p> : null}
            </div>
            <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
          </div>;
        })}
      </section>;
    })}

    {!energyReady && preview.energy_estimate?.missing_inputs?.length ? <div className="notice" style={{ marginTop: 18 }}>ยังประเมินพลังงานไม่ได้ เพราะข้อมูลที่จำเป็นยังไม่ครบ</div> : null}
    <div className="cta-row"><ActivateProgramButton fingerprint={preview.program_fingerprint} /></div>
  </AppShell>;
}
