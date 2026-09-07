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
  metadata: { display_name?: string } | null;
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
    <div className="topline">Program</div><h1 style={{ fontSize: "3.4rem" }}>Training + Nutrition</h1>
    <div className="card"><h2>No active program yet</h2><p>Preview จะถูกสร้างจาก Foundation inputs ฝั่ง server และเมื่อ Activate จะสร้าง immutable Program Version.</p><div className="cta-row"><Link className="btn primary" href="/program/preview">Open Program Preview</Link><Link className="btn" href="/program/start">Edit Foundation Inputs</Link></div></div>
  </AppShell>;

  const [{ data: items }, { data: nutrition }] = await Promise.all([
    supabase.from("training_program_items").select("*").eq("program_id", program.program_id).order("training_day").order("display_order"),
    supabase.from("nutrition_targets").select("*").eq("program_id", program.program_id).maybeSingle(),
  ]);

  const typedItems = (items ?? []) as TrainingProgramItem[];
  const byDay = typedItems.reduce<Map<number, TrainingProgramItem[]>>((acc, item) => {
    const list = acc.get(item.training_day) ?? [];
    list.push(item);
    acc.set(item.training_day, list);
    return acc;
  }, new Map<number, TrainingProgramItem[]>());

  return <AppShell>
    <div className="topline">{program.program_tier} · Program v{program.program_version}</div>
    <h1 style={{ fontSize: "3.4rem" }}>Active Program</h1>
    {params.activated && <div className="notice" style={{ marginBottom: 16 }}>Program activated successfully. History เดิมถูกเก็บไว้เป็น version ก่อนหน้า.</div>}
    <div className="grid">
      <div className="card"><div className="kicker">Status</div><div className="metric cyan">{program.status}</div></div>
      <div className="card"><div className="kicker">Protein</div><div className="metric">{nutrition?.protein_low_g ?? "–"}–{nutrition?.protein_high_g ?? "–"} g</div></div>
      <div className="card"><div className="kicker">Calories</div><div className="metric">{nutrition?.calorie_low ?? "–"} {nutrition?.calorie_high ? `–${nutrition.calorie_high}` : ""}</div><p>{nutrition?.calorie_low == null ? "ยังไม่เดาจากข้อมูลไม่พอ" : "Current starting range"}</p></div>
    </div>
    {Array.from(byDay.entries()).map(([day, dayItems]) => <section className="card day" key={day}><h2>Day {day}</h2>{dayItems.map((x) => <div className="exercise" key={x.item_id}><div><strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/><small>{x.movement_slot}</small></div><div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div></div>)}</section>)}
    <div className="cta-row"><Link className="btn" href="/program/start">Update Foundation Inputs</Link><Link className="btn" href="/progress">Log Progress</Link></div>
  </AppShell>;
}
