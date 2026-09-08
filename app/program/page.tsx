import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type ProgressionRule = { trigger?: string; action?: string };
type TrainingProgramItem = {
  item_id: string;
  training_day: number;
  exercise_key: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  target_rir: number | string;
  display_order: number;
  metadata: {
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
  goal?: string;
  training_experience?: string;
  training_days_per_week?: number;
  equipment_profile?: string;
  program_family?: string;
  weekly_volume?: Record<string, number>;
  focus_label?: string;
  primary_focus?: string;
  session_duration_min?: number;
  engine_version?: string;
  contract_version?: string;
  program_fingerprint?: string;
};

type Baseline = {
  goal?: string | null;
  training_experience?: string | null;
  training_days_per_week?: number | null;
  equipment_profile?: string | null;
};

type TrainingProfile = { session_duration_min?: number | null; priority_muscles?: unknown };

const muscleLabel: Record<string, string> = {
  CHEST: "Chest", BACK: "Back", QUADS: "Quads", HAMSTRINGS: "Hamstrings", SHOULDERS: "Shoulders",
  BICEPS: "Biceps", TRICEPS: "Triceps", CALVES: "Calves", CORE: "Core", ROTATOR_CUFF: "Rotator Cuff", LOWER_TRAP: "Lower Trap / Scapular",
};

const valueLabel: Record<string, string> = {
  MUSCLE_GAIN: "Muscle Gain", FAT_LOSS: "Fat Loss", RECOMPOSITION: "Recomposition", GENERAL_FITNESS: "General Fitness",
  BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", EXPERIENCED: "Experienced",
  FULL_GYM: "Full Gym", LIMITED_GYM: "Limited Gym", HOME_BASIC: "Home Basic",
};

function currentFocus(profile: TrainingProfile | null) {
  const p = profile?.priority_muscles;
  if (typeof p === "string") return p.toUpperCase();
  if (Array.isArray(p)) return String(p[0] ?? "").toUpperCase();
  if (p && typeof p === "object") {
    const x = p as Record<string, unknown>;
    return String(x.primary ?? x.focus ?? x.primary_focus ?? "").toUpperCase();
  }
  return "";
}

function inputsChanged(snapshot: GoalSnapshot, baseline: Baseline | null, training: TrainingProfile | null) {
  if (!baseline || !training) return false;
  return (
    snapshot.goal !== baseline.goal ||
    snapshot.training_experience !== baseline.training_experience ||
    Number(snapshot.training_days_per_week) !== Number(baseline.training_days_per_week) ||
    snapshot.equipment_profile !== baseline.equipment_profile ||
    snapshot.primary_focus !== currentFocus(training) ||
    Number(snapshot.session_duration_min) !== Number(training.session_duration_min)
  );
}

export default async function ProgramPage({ searchParams }: { searchParams: Promise<{ activated?: string }> }) {
  const params = await searchParams;
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">Supabase env ยังไม่ถูก inject.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const { data: program } = await supabase.from("programs")
    .select("program_id,program_version,program_tier,status,activated_at,goal_snapshot")
    .eq("user_id", userId).eq("status", "ACTIVE").maybeSingle();

  if (!program) return <AppShell>
    <div className="topline">Program</div><h1>Training + Nutrition</h1>
    <div className="card"><h2>No active program yet</h2><p>สร้าง Program Preview จาก Focus, Training Days, Experience, Equipment และ Session Time แล้ว Activate เพื่อเริ่ม version แรก.</p><div className="cta-row"><Link className="btn primary" href="/program/preview">Open Program Preview</Link><Link className="btn" href="/program/start">Build Program</Link></div></div>
  </AppShell>;

  const [{ data: items }, { data: nutrition }, { data: baselineRaw }, { data: trainingRaw }] = await Promise.all([
    supabase.from("training_program_items").select("*").eq("program_id", program.program_id).order("training_day").order("display_order"),
    supabase.from("nutrition_targets").select("*").eq("program_id", program.program_id).maybeSingle(),
    supabase.from("user_baseline").select("goal,training_experience,training_days_per_week,equipment_profile").eq("user_id", userId).maybeSingle(),
    supabase.from("training_profiles").select("session_duration_min,priority_muscles").eq("user_id", userId).maybeSingle(),
  ]);

  const typedItems = (items ?? []) as TrainingProgramItem[];
  const snapshot = (program.goal_snapshot ?? {}) as GoalSnapshot;
  const baseline = (baselineRaw ?? null) as Baseline | null;
  const training = (trainingRaw ?? null) as TrainingProfile | null;
  const pendingInputs = inputsChanged(snapshot, baseline, training);
  const byDay = typedItems.reduce<Map<number, TrainingProgramItem[]>>((acc, item) => {
    const list = acc.get(item.training_day) ?? [];
    list.push(item);
    acc.set(item.training_day, list);
    return acc;
  }, new Map<number, TrainingProgramItem[]>());
  const volumeEntries = Object.entries(snapshot.weekly_volume ?? {});

  return <AppShell>
    <div className="topline">{program.program_tier} · Program v{program.program_version}</div>
    <h1>{snapshot.program_family ?? "Active Program"}</h1>
    <p>{valueLabel[snapshot.goal ?? ""] ?? snapshot.goal ?? "–"} · {valueLabel[snapshot.training_experience ?? ""] ?? snapshot.training_experience ?? "–"} · {valueLabel[snapshot.equipment_profile ?? ""] ?? snapshot.equipment_profile ?? "–"} · {snapshot.focus_label ?? "–"} · {snapshot.training_days_per_week ?? "–"} days · {snapshot.session_duration_min ?? "–"} min</p>
    {params.activated && <div className="notice" style={{ marginBottom: 16 }}>Program activated successfully. Version ก่อนหน้าจะถูกเก็บเป็น history เมื่อมีการสร้าง version ใหม่.</div>}
    {pendingInputs && <div className="notice warning" style={{ marginBottom: 16 }}>Foundation inputs ปัจจุบันต่างจาก Active Program v{program.program_version}. Active Program จะยังไม่เปลี่ยนจนกว่าคุณจะ Preview และ Activate version ใหม่.</div>}

    <div className="grid">
      <div className="card"><div className="kicker">Focus</div><div className="metric cyan">{snapshot.focus_label ?? "–"}</div></div>
      <div className="card"><div className="kicker">Session</div><div className="metric">{snapshot.session_duration_min ?? "–"} min</div></div>
      <div className="card"><div className="kicker">Protein</div><div className="metric">{nutrition?.protein_low_g ?? "–"}–{nutrition?.protein_high_g ?? "–"} g</div></div>
      <div className="card"><div className="kicker">Calories</div><div className="metric" style={{ fontSize: "1.15rem" }}>{nutrition?.calorie_low != null ? `${nutrition.calorie_low}–${nutrition.calorie_high}` : "Calibrating"}</div><p>{nutrition?.maintenance_low != null ? `Maintenance ${nutrition.maintenance_low}–${nutrition.maintenance_high}` : "ข้อมูลยังไม่พอสำหรับ initial estimate"}</p></div>
    </div>

    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}><div className="kicker">Direct hard sets / week</div><h2>Weekly Training Budget</h2><p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p></section> : null}

    {Array.from(byDay.entries()).map(([day, dayItems]) => {
      const dayLabel = dayItems[0]?.metadata?.day_label ?? `Day ${day}`;
      return <section className="card day" key={day}>
        <div className="kicker">Day {day}</div><h2>{dayLabel}</h2>
        {dayItems.map((x) => <div className="exercise" key={x.item_id}>
          <div style={{ minWidth: 0 }}>
            <strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/>
            <small>{x.metadata?.target_label ?? "Training movement"}{x.metadata?.focus_boost ? " · FOCUS" : ""}</small>
            {x.metadata?.progression?.trigger && x.metadata?.progression?.action ? <p style={{ margin: "6px 0 0", fontSize: ".82rem" }}><strong>NEXT:</strong> {x.metadata.progression.trigger} → {x.metadata.progression.action}</p> : null}
            {x.metadata?.alternative_name ? <p style={{ margin: "4px 0 0", fontSize: ".78rem", opacity: .72 }}>Alternative: {x.metadata.alternative_name}</p> : null}
          </div>
          <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
        </div>)}
      </section>;
    })}

    <div className="cta-row"><Link className="btn" href="/program/start">Update Program Inputs</Link>{pendingInputs && <Link className="btn primary" href="/program/preview">Preview New Version</Link>}<Link className="btn" href="/progress">Log Progress</Link></div>
  </AppShell>;
}
