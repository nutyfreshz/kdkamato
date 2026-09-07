import { AppShell } from "@/components/app-shell";
import { ActivateProgramButton } from "@/components/activate-program-button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type PreviewItem = {
  training_day: number;
  movement_slot: string;
  exercise_key: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  target_rir: number;
  display_order: number;
  metadata?: { display_name?: string } | null;
};

type PreviewData = {
  family: string;
  days: number;
  training_items: PreviewItem[];
  nutrition_target: {
    maintenance_low: number | null;
    maintenance_high: number | null;
    calorie_low: number | null;
    calorie_high: number | null;
    protein_low_g: number | null;
    protein_high_g: number | null;
    estimate_confidence: string | null;
  };
  guardrails: string[];
};

export default async function ProgramPreviewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">Supabase env ยังไม่ถูก inject จึงยังอ่าน baseline จริงไม่ได้.</div></AppShell>;

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

  if (error || !data?.training_items) {
    return <AppShell><div className="notice warning">ยังสร้าง preview ไม่ได้: {error?.message ?? data?.error ?? "UNKNOWN_ERROR"}</div></AppShell>;
  }

  const preview = data as PreviewData;
  const byDay = preview.training_items.reduce((acc, item) => {
    const items = acc.get(item.training_day) ?? [];
    items.push(item);
    acc.set(item.training_day, items);
    return acc;
  }, new Map<number, PreviewItem[]>());

  return <AppShell>
    <div className="topline">Free Program Preview</div>
    <h1 style={{ fontSize: "3.4rem" }}>{preview.family}</h1>
    {params.error && <div className="notice warning" style={{ marginBottom: 16 }}>Activation failed: {decodeURIComponent(params.error)}</div>}
    <div className="grid">
      <div className="card"><div className="kicker">Protein starting range</div><div className="metric cyan">{preview.nutrition_target.protein_low_g}–{preview.nutrition_target.protein_high_g} g</div></div>
      <div className="card"><div className="kicker">Frequency</div><div className="metric">{preview.days} days</div></div>
      <div className="card"><div className="kicker">Energy estimate</div><div className="metric" style={{ fontSize: "1.2rem" }}>{preview.nutrition_target.estimate_confidence ?? "LIMITED"}</div><p>ยังไม่เดา maintenance จาก activity multiplier.</p></div>
    </div>
    {Array.from(byDay.entries()).map(([day, items]) => <section className="card day" key={day}>
      <h2>Day {day}</h2>
      {items.sort((a,b) => a.display_order - b.display_order).map((x) => <div className="exercise" key={`${x.training_day}-${x.display_order}`}>
        <div><strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/><small>{x.movement_slot}</small></div>
        <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
      </div>)}
    </section>)}
    <div className="notice warning" style={{ marginTop: 18 }}>{preview.guardrails.join(" • ")}</div>
    <div className="cta-row"><ActivateProgramButton /></div>
  </AppShell>;
}
