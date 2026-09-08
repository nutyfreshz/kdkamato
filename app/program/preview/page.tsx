import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ActivateProgramButton } from "@/components/activate-program-button";
import { ProgramWeek } from "@/components/program-week";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

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
  CHEST: "Chest", BACK: "Back", QUADS: "Quads", HAMSTRINGS: "Hamstrings", SHOULDERS: "Shoulders",
  BICEPS: "Biceps", TRICEPS: "Triceps", CALVES: "Calves", CORE: "Core", ROTATOR_CUFF: "Rotator Cuff", LOWER_TRAP: "Lower Trap / Scapular",
};

const valueLabel: Record<string, string> = {
  MUSCLE_GAIN: "Muscle Gain", FAT_LOSS: "Fat Loss", RECOMPOSITION: "Recomposition", GENERAL_FITNESS: "General Fitness",
  BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", EXPERIENCED: "Experienced",
  FULL_GYM: "Full Gym", LIMITED_GYM: "Limited Gym", HOME_BASIC: "Home Basic",
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
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม จึงยังสร้าง Preview จากข้อมูลจริงไม่ได้.</div></AppShell>;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return <AppShell><div className="notice warning">Session หมดอายุ กรุณาเข้าสู่ระบบใหม่.</div></AppShell>;

  const { data, error } = await supabase.functions.invoke("kdk-free-program", {
    body: { mode: "preview" },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error || !data) {
    const payload = await edgeErrorPayload(error);
    const code = payload?.error ?? "UNKNOWN_ERROR";
    if (code === "BASELINE_REQUIRED" || code === "FOUNDATION_INVALID") {
      return <AppShell>
        <div className="topline">Program Setup Required</div>
        <h1>ยังสร้าง Program Preview ไม่ได้</h1>
        <div className="notice warning">{code === "BASELINE_REQUIRED" ? "ยังไม่มีข้อมูล Program Setup." : `ข้อมูล Program Setup ไม่ผ่าน validation${payload?.fields?.length ? `: ${payload.fields.join(", ")}` : ""}.`}</div>
        <div className="cta-row"><Link className="btn primary" href="/program/start">กลับไปแก้ Program Setup</Link></div>
      </AppShell>;
    }
    if (code === "ENGINE_VERSION_MISMATCH" || code === "PROGRAM_CONTRACT_INCONSISTENT" || code === "PROGRAM_VALIDATION_FAILED") {
      return <AppShell>
        <div className="topline">Integration Guard</div>
        <h1>Program Preview ถูกหยุดไว้</h1>
        <div className="notice warning">Program Engine validation ไม่ผ่าน ({code}) จึงยังไม่อนุญาตให้ Activate.</div>
      </AppShell>;
    }
    return <AppShell><div className="notice warning">ยังสร้าง Preview ไม่ได้: {code !== "UNKNOWN_ERROR" ? code : error?.message ?? code}</div></AppShell>;
  }

  if (!validPreview(data)) {
    return <AppShell>
      <div className="topline">Integration Guard</div>
      <h1>Program Preview ถูกหยุดไว้</h1>
      <div className="notice warning">Frontend และ Program Engine contract ไม่ตรงกัน ระบบจะไม่ใช้ fallback และยังไม่อนุญาตให้ Activate.</div>
      <div className="cta-row"><Link className="btn primary" href="/program/start">สร้าง Program ใหม่</Link></div>
    </AppShell>;
  }

  const preview = data;
  const byDay = preview.training_items.reduce((acc, item) => {
    const items = acc.get(item.training_day) ?? [];
    items.push(item);
    acc.set(item.training_day, items);
    return acc;
  }, new Map<number, PreviewItem[]>());

  const dayLabels = Object.fromEntries(Array.from(byDay.entries()).map(([day, items]) => [day, items[0]?.metadata?.day_label ?? `Day ${day}`]));
  const energyReady = preview.nutrition_target.maintenance_low != null && preview.nutrition_target.maintenance_high != null;
  const volumeEntries = Object.entries(preview.weekly_volume);
  const snapshot = preview.goal_snapshot;
  const activationError = params.error ? decodeURIComponent(params.error) : null;

  return <AppShell>
    <div className="topline">Program Preview</div>
    <h1>{preview.family}</h1>
    <p>{valueLabel[snapshot.goal] ?? snapshot.goal} · {valueLabel[snapshot.training_experience] ?? snapshot.training_experience} · {valueLabel[snapshot.equipment_profile] ?? snapshot.equipment_profile} · {preview.focus_label} · {preview.days} วัน · {preview.session_duration_min} นาที</p>
    {activationError && <div className="notice warning" style={{ marginBottom: 16 }}>{activationError === "PREVIEW_STALE" ? "ข้อมูลหรือ Engine เปลี่ยนหลังจาก Preview นี้ กรุณาตรวจ Preview ล่าสุดแล้ว Activate ใหม่." : `Activate ไม่สำเร็จ: ${activationError}`}</div>}

    <div className="grid">
      <div className="card"><div className="kicker">Focus</div><div className="metric cyan">{preview.focus_label}</div></div>
      <div className="card"><div className="kicker">ตารางฝึก</div><div className="metric">{preview.days} วัน</div><p>{preview.session_duration_min} นาที / ครั้ง</p></div>
      <div className="card"><div className="kicker">Protein</div><div className="metric">{preview.nutrition_target.protein_low_g}–{preview.nutrition_target.protein_high_g} g</div></div>
      <div className="card"><div className="kicker">Energy</div><div className="metric" style={{ fontSize: "1.15rem" }}>{energyReady ? `${preview.nutrition_target.calorie_low}–${preview.nutrition_target.calorie_high} kcal` : "กำลังปรับเทียบ"}</div><p>{energyReady ? `Maintenance ${preview.nutrition_target.maintenance_low}–${preview.nutrition_target.maintenance_high}` : "ยังไม่แสดงจน measurable inputs เพียงพอ"}</p></div>
    </div>

    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">Direct hard sets / week</div>
      <h2>Weekly Training Budget</h2>
      <p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p>
    </section> : null}

    <ProgramWeek days={preview.days} focus={preview.focus} dayLabels={dayLabels} />

    {Array.from(byDay.entries()).map(([day, items]) => {
      const sorted = [...items].sort((a, b) => a.display_order - b.display_order);
      const dayLabel = sorted[0]?.metadata?.day_label ?? `Day ${day}`;
      return <section className="card day" key={day}>
        <div className="kicker">Day {day}</div>
        <h2>{dayLabel}</h2>
        {sorted.map((x) => {
          const next = progressionText(x);
          return <div className="exercise" key={`${x.training_day}-${x.display_order}`}>
            <div style={{ minWidth: 0 }}>
              <strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/>
              <small>{x.metadata?.target_label ?? "Training movement"}{x.metadata?.focus_boost ? " · FOCUS" : ""}</small>
              {next ? <p style={{ margin: "6px 0 0", fontSize: ".82rem" }}><strong>ถัดไป:</strong> {next}</p> : null}
              {x.metadata?.alternative_name ? <p style={{ margin: "4px 0 0", fontSize: ".78rem", opacity: .72 }}>ทางเลือก: {x.metadata.alternative_name}</p> : null}
            </div>
            <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
          </div>;
        })}
      </section>;
    })}

    {!energyReady && preview.energy_estimate?.missing_inputs?.length ? <div className="notice" style={{ marginTop: 18 }}>Energy Estimate ยังไม่เปิดเพราะยังขาด: {preview.energy_estimate.missing_inputs.join(", ")}.</div> : null}
    <div className="cta-row"><ActivateProgramButton fingerprint={preview.program_fingerprint} /></div>
  </AppShell>;
}
