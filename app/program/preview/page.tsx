import { AppShell } from "@/components/app-shell";
import { ActivateProgramButton } from "@/components/activate-program-button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

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

type PreviewData = {
  family: string;
  focus?: string;
  focus_label?: string;
  days: number;
  session_duration_min?: number;
  training_items: PreviewItem[];
  weekly_volume?: Record<string, number>;
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

function progressionText(item: PreviewItem) {
  const p = item.metadata?.progression;
  if (!p?.trigger || !p.action) return null;
  return `${p.trigger} → ${p.action}`;
}

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
    <div className="topline">Free Program Preview</div>
    <h1>{preview.family}</h1>
    {params.error && <div className="notice warning" style={{ marginBottom: 16 }}>Activation failed: {decodeURIComponent(params.error)}</div>}

    <div className="grid">
      <div className="card"><div className="kicker">Training Focus</div><div className="metric cyan">{preview.focus_label ?? "Balanced"}</div></div>
      <div className="card"><div className="kicker">Schedule</div><div className="metric">{preview.days} days</div><p>{preview.session_duration_min ?? 60} min / session</p></div>
      <div className="card"><div className="kicker">Protein</div><div className="metric">{preview.nutrition_target.protein_low_g}–{preview.nutrition_target.protein_high_g} g</div></div>
      <div className="card"><div className="kicker">Energy</div><div className="metric" style={{ fontSize: "1.15rem" }}>{energyReady ? `${preview.nutrition_target.calorie_low}–${preview.nutrition_target.calorie_high} kcal` : "Calibrating"}</div><p>{energyReady ? `Maintenance ${preview.nutrition_target.maintenance_low}–${preview.nutrition_target.maintenance_high}` : "ยังไม่แสดงจน measurable inputs พอ"}</p></div>
    </div>

    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">Direct hard sets / week</div>
      <h2>Weekly Training Budget</h2>
      <p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p>
    </section> : null}

    {Array.from(byDay.entries()).map(([day, items]) => {
      const sorted = items.sort((a, b) => a.display_order - b.display_order);
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
              {next ? <p style={{ margin: "6px 0 0", fontSize: ".82rem" }}><strong>NEXT:</strong> {next}</p> : null}
              {x.metadata?.alternative_name ? <p style={{ margin: "4px 0 0", fontSize: ".78rem", opacity: .72 }}>Alternative: {x.metadata.alternative_name}</p> : null}
            </div>
            <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
          </div>;
        })}
      </section>;
    })}

    {!energyReady && preview.energy_estimate?.missing_inputs?.length ? <div className="notice" style={{ marginTop: 18 }}>Energy Estimate ยังไม่เปิดเพราะยังขาด: {preview.energy_estimate.missing_inputs.join(", ")}.</div> : null}
    <div className="cta-row"><ActivateProgramButton /></div>
  </AppShell>;
}
