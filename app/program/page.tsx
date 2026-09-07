import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type TrainingProgramItem = {
  item_id: string;
  training_day: number;
  movement_slot: string;
  exercise_key: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  target_rir: number | string;
  display_order: number;
  metadata: {
    display_name?: string;
    focus_label?: string;
    alternative_name?: string | null;
  } | null;
};

type GoalSnapshot = {
  program_family?: string;
  program_rationale?: string[];
  weekly_volume?: Record<string, number>;
  engine_version?: string;
  energy_estimate?: {
    confidence?: string | null;
    basis?: string | null;
  };
};

const muscleLabel: Record<string, string> = {
  CHEST: "Chest",
  BACK: "Back",
  QUADS: "Quads",
  HAMSTRINGS: "Hamstrings",
  SHOULDERS: "Shoulders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  CALVES: "Calves",
  CORE: "Core",
};

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
    <div className="card"><h2>No active program yet</h2><p>Preview จะถูกสร้างจาก Foundation inputs ฝั่ง server และเมื่อ Activate จะสร้าง immutable Program Version.</p><div className="cta-row"><Link className="btn primary" href="/program/preview">Open Program Preview</Link><Link className="btn" href="/program/start">Edit Foundation Inputs</Link></div></div>
  </AppShell>;

  const [{ data: items }, { data: nutrition }] = await Promise.all([
    supabase.from("training_program_items").select("*").eq("program_id", program.program_id).order("training_day").order("display_order"),
    supabase.from("nutrition_targets").select("*").eq("program_id", program.program_id).maybeSingle(),
  ]);

  const typedItems = (items ?? []) as TrainingProgramItem[];
  const snapshot = (program.goal_snapshot ?? {}) as GoalSnapshot;
  const byDay = typedItems.reduce<Map<number, TrainingProgramItem[]>>((acc, item) => {
    const list = acc.get(item.training_day) ?? [];
    list.push(item);
    acc.set(item.training_day, list);
    return acc;
  }, new Map<number, TrainingProgramItem[]>());
  const volumeEntries = Object.entries(snapshot.weekly_volume ?? {});

  return <AppShell>
    <div className="topline">{program.program_tier} · Program v{program.program_version}{snapshot.engine_version ? ` · ${snapshot.engine_version}` : ""}</div>
    <h1>{snapshot.program_family ?? "Active Program"}</h1>
    {params.activated && <div className="notice" style={{ marginBottom: 16 }}>Program activated successfully. History เดิมถูกเก็บไว้เป็น version ก่อนหน้า.</div>}

    <div className="grid">
      <div className="card"><div className="kicker">Status</div><div className="metric cyan">{program.status}</div></div>
      <div className="card"><div className="kicker">Protein</div><div className="metric">{nutrition?.protein_low_g ?? "–"}–{nutrition?.protein_high_g ?? "–"} g</div></div>
      <div className="card"><div className="kicker">Maintenance</div><div className="metric" style={{ fontSize: "1.2rem" }}>{nutrition?.maintenance_low != null ? `${nutrition.maintenance_low}–${nutrition.maintenance_high} kcal` : "–"}</div><p>{snapshot.energy_estimate?.confidence ?? nutrition?.estimate_confidence ?? "LIMITED"}</p></div>
      <div className="card"><div className="kicker">Goal calories</div><div className="metric" style={{ fontSize: "1.2rem" }}>{nutrition?.calorie_low ?? "–"} {nutrition?.calorie_high ? `–${nutrition.calorie_high}` : ""}</div><p>{nutrition?.calorie_low == null ? "ยังไม่แสดงจนข้อมูลพอ" : "Initial range — calibrate from real response"}</p></div>
    </div>

    {snapshot.program_rationale?.length ? <section className="card" style={{ marginTop: 18 }}><div className="kicker">Why this program</div>{snapshot.program_rationale.map((reason) => <p key={reason}>• {reason}</p>)}</section> : null}
    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}><div className="kicker">Starting weekly hard sets</div><p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p></section> : null}

    {Array.from(byDay.entries()).map(([day, dayItems]) => <section className="card day" key={day}>
      <h2>Day {day}</h2>
      {dayItems.map((x) => <div className="exercise" key={x.item_id}>
        <div><strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/><small>{x.metadata?.focus_label ?? "Training movement"}{x.metadata?.alternative_name ? ` · Good alternative: ${x.metadata.alternative_name}` : ""}</small></div>
        <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
      </div>)}
    </section>)}

    <div className="cta-row"><Link className="btn" href="/program/start">Update Foundation Inputs</Link><Link className="btn" href="/progress">Log Progress</Link></div>
  </AppShell>;
}
