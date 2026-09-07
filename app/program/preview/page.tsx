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
  metadata?: {
    display_name?: string;
    focus_label?: string;
    alternative_name?: string | null;
  } | null;
};

type PreviewData = {
  engine_version?: string;
  family: string;
  days: number;
  training_items: PreviewItem[];
  weekly_volume?: Record<string, number>;
  program_rationale?: string[];
  energy_estimate?: {
    confidence?: string | null;
    basis?: string | null;
    missing_inputs?: string[];
  };
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

  const energyReady = preview.nutrition_target.maintenance_low != null && preview.nutrition_target.maintenance_high != null;
  const volumeEntries = Object.entries(preview.weekly_volume ?? {});

  return <AppShell>
    <div className="topline">Free Program Preview {preview.engine_version ? `· ${preview.engine_version}` : ""}</div>
    <h1>{preview.family}</h1>
    {params.error && <div className="notice warning" style={{ marginBottom: 16 }}>Activation failed: {decodeURIComponent(params.error)}</div>}

    <div className="grid">
      <div className="card"><div className="kicker">Protein starting range</div><div className="metric cyan">{preview.nutrition_target.protein_low_g}–{preview.nutrition_target.protein_high_g} g</div></div>
      <div className="card"><div className="kicker">Frequency</div><div className="metric">{preview.days} days</div></div>
      <div className="card">
        <div className="kicker">Initial maintenance estimate</div>
        <div className="metric" style={{ fontSize: "1.2rem" }}>{energyReady ? `${preview.nutrition_target.maintenance_low}–${preview.nutrition_target.maintenance_high} kcal` : "Needs more data"}</div>
        <p>Confidence: {preview.nutrition_target.estimate_confidence ?? "LIMITED"}</p>
      </div>
      <div className="card">
        <div className="kicker">Goal calorie range</div>
        <div className="metric" style={{ fontSize: "1.2rem" }}>{preview.nutrition_target.calorie_low != null ? `${preview.nutrition_target.calorie_low}–${preview.nutrition_target.calorie_high} kcal` : "Not shown yet"}</div>
        <p>{preview.energy_estimate?.basis ?? "ไม่เดาจาก subjective activity multiplier"}</p>
      </div>
    </div>

    {preview.program_rationale?.length ? <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">Why this foundation</div>
      <h2>ไม่ได้สุ่ม และไม่ได้เลือกจาก template เดียว</h2>
      {preview.program_rationale.map((reason) => <p key={reason}>• {reason}</p>)}
    </section> : null}

    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">Starting weekly hard sets</div>
      <h2>Weekly Volume</h2>
      <p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p>
      <small>เป็น starting prescription ไม่ใช่ claim ว่านี่คือ individual optimal volume. Progress + recovery จะเป็น authority สำหรับการปรับภายหลัง.</small>
    </section> : null}

    {Array.from(byDay.entries()).map(([day, items]) => <section className="card day" key={day}>
      <h2>Day {day}</h2>
      {items.sort((a,b) => a.display_order - b.display_order).map((x) => <div className="exercise" key={`${x.training_day}-${x.display_order}`}>
        <div>
          <strong>{x.metadata?.display_name ?? x.exercise_key}</strong><br/>
          <small>{x.metadata?.focus_label ?? "Training movement"}{x.metadata?.alternative_name ? ` · Good alternative: ${x.metadata.alternative_name}` : ""}</small>
        </div>
        <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
      </div>)}
    </section>)}

    {!energyReady && preview.energy_estimate?.missing_inputs?.length ? <div className="notice" style={{ marginTop: 18 }}>Energy Estimate ยังไม่เปิดเพราะยังขาด: {preview.energy_estimate.missing_inputs.join(", ")}.</div> : null}
    <div className="notice warning" style={{ marginTop: 18 }}>{preview.guardrails.join(" • ")}</div>
    <div className="cta-row"><ActivateProgramButton /></div>
  </AppShell>;
}
