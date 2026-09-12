import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExerciseFeedbackForm } from "@/components/exercise-feedback-form";
import { ExerciseVisualPair, RepDbAttribution } from "@/components/exercise-visual-pair";
import { ProExerciseSuggestions, type ProExerciseSuggestionPayload } from "@/components/pro-exercise-suggestions";
import { ProgramWeek } from "@/components/program-week";
import { getExerciseVisual } from "@/lib/exercise-visuals";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type ProgressionRule = { trigger?: string; action?: string };
type ItemAutoUpdate = { kind?: string; source_result_id?: string; result_code?: string; applied_at?: string };
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
    day_label?: string;
    target_label?: string;
    primary_muscle?: string;
    focus_boost?: boolean;
    alternative_name?: string | null;
    progression?: ProgressionRule;
    auto_update?: ItemAutoUpdate;
  } | null;
};

type AutoUpdateChange = { exercise_key?: string; exercise_name?: string };
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
  auto_update?: {
    kind?: string;
    source_result_id?: string;
    result_code?: string;
    evidence_family?: string;
    percent_difference?: number;
    movement_slot?: string;
    previous_program_id?: string;
    previous_program_version?: number;
    applied_at?: string;
    changes?: AutoUpdateChange[];
  };
};

type Baseline = {
  goal?: string | null;
  training_experience?: string | null;
  training_days_per_week?: number | null;
  equipment_profile?: string | null;
};

type TrainingProfile = { session_duration_min?: number | null; priority_muscles?: unknown };
type ExerciseFeedbackRow = {
  exercise_key: string;
  performance_status: string | null;
  tolerance_status: string | null;
  recovery_status: string | null;
  preference_status: string | null;
  optional_note: string | null;
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

const focusLabel: Record<string, string> = {
  BALANCED: "สมดุลทั้งร่างกาย", CHEST: "เน้นอก", BACK: "เน้นหลัง", SHOULDERS: "เน้นหัวไหล่", ARMS: "เน้นแขน", LEGS: "เน้นขา",
  QUADS: "เน้นต้นขาด้านหน้า", HAMSTRINGS: "เน้นต้นขาด้านหลัง", GLUTES: "เน้นก้น", REPOSTURE: "เน้นสมดุลหัวไหล่และสะบัก",
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

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function itemLabel(item: TrainingProgramItem | undefined) {
  return item?.metadata?.display_name ?? item?.exercise_key ?? "—";
}

function itemPositionKey(item: TrainingProgramItem) {
  return `${item.training_day}:${item.display_order}:${item.movement_slot}`;
}

export default async function ProgramPage({ searchParams }: { searchParams: Promise<{ activated?: string }> }) {
  const params = await searchParams;
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลไม่พร้อมใช้งานชั่วคราว</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน</div></AppShell>;

  const { data: program } = await supabase.from("programs")
    .select("program_id,program_version,program_tier,status,activated_at,goal_snapshot")
    .eq("user_id", userId).eq("status", "ACTIVE").maybeSingle();

  if (!program) return <AppShell>
    <div className="topline">โปรแกรม</div><h1>โปรแกรมของคุณ</h1>
    <div className="card"><h2>ยังไม่มีโปรแกรมปัจจุบัน</h2><p>ตั้งค่าเป้าหมาย จุดเน้น จำนวนวันฝึก ประสบการณ์ อุปกรณ์ และเวลาฝึกต่อครั้ง แล้วดูตัวอย่างก่อนเปิดใช้โปรแกรมเวอร์ชันแรก</p><div className="cta-row"><Link className="btn primary" href="/program/start">สร้างโปรแกรม</Link></div></div>
  </AppShell>;

  const today = bangkokDate();
  const [
    { data: items },
    { data: nutrition },
    { data: baselineRaw },
    { data: trainingRaw },
    { data: accessRaw },
    { data: feedbackRaw },
  ] = await Promise.all([
    supabase.from("training_program_items").select("*").eq("program_id", program.program_id).order("training_day").order("display_order"),
    supabase.from("nutrition_targets").select("*").eq("program_id", program.program_id).maybeSingle(),
    supabase.from("user_baseline").select("goal,training_experience,training_days_per_week,equipment_profile").eq("user_id", userId).maybeSingle(),
    supabase.from("training_profiles").select("session_duration_min,priority_muscles").eq("user_id", userId).maybeSingle(),
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("exercise_response_entries")
      .select("exercise_key,performance_status,tolerance_status,recovery_status,preference_status,optional_note")
      .eq("user_id", userId)
      .eq("program_id", program.program_id)
      .eq("entry_date", today),
  ]);

  const typedItems = (items ?? []) as TrainingProgramItem[];
  const snapshot = (program.goal_snapshot ?? {}) as GoalSnapshot;
  const baseline = (baselineRaw ?? null) as Baseline | null;
  const training = (trainingRaw ?? null) as TrainingProfile | null;
  const isPro = accessRaw?.tier === "PRO";
  const proSuggestionResult = isPro ? await supabase.rpc("get_my_pro_exercise_suggestions") : null;
  const proSuggestions = (proSuggestionResult?.data ?? null) as ProExerciseSuggestionPayload | null;
  const feedbackMap = new Map<string, ExerciseFeedbackRow>(
    ((feedbackRaw ?? []) as ExerciseFeedbackRow[]).map((x) => [x.exercise_key, x]),
  );
  const pendingInputs = inputsChanged(snapshot, baseline, training);
  const byDay = typedItems.reduce<Map<number, TrainingProgramItem[]>>((acc, item) => {
    const list = acc.get(item.training_day) ?? [];
    list.push(item);
    acc.set(item.training_day, list);
    return acc;
  }, new Map<number, TrainingProgramItem[]>());
  const dayLabels = Object.fromEntries(Array.from(byDay.entries()).map(([day, dayItems]) => [day, dayItems[0]?.metadata?.day_label ?? `วันที่ฝึก ${day}`]));
  const volumeEntries = Object.entries(snapshot.weekly_volume ?? {});
  const hasRepDbVisuals = typedItems.some((x) => Boolean(getExerciseVisual(x.exercise_key)));
  const autoUpdate = snapshot.auto_update?.kind === "LAB_C1_TARGETED_REFRESH" ? snapshot.auto_update : null;
  const autoUpdatedExercises = (autoUpdate?.changes ?? [])
    .map((change) => change.exercise_name ?? change.exercise_key)
    .filter(Boolean);
  const displayFocus = focusLabel[snapshot.primary_focus ?? ""] ?? snapshot.focus_label ?? "–";

  let previousItems: TrainingProgramItem[] = [];
  if (autoUpdate?.previous_program_id) {
    const { data } = await supabase.from("training_program_items")
      .select("*")
      .eq("program_id", autoUpdate.previous_program_id)
      .order("training_day")
      .order("display_order");
    previousItems = (data ?? []) as TrainingProgramItem[];
  }

  const previousByPosition = new Map(previousItems.map((item) => [itemPositionKey(item), item]));
  const autoUpdatePairs = autoUpdate ? typedItems
    .filter((item) => item.metadata?.auto_update?.kind === "LAB_C1_TARGETED_REFRESH" && item.metadata?.auto_update?.source_result_id === autoUpdate.source_result_id)
    .map((item) => ({ from: itemLabel(previousByPosition.get(itemPositionKey(item))), to: itemLabel(item) }))
    .filter((pair) => pair.from !== pair.to) : [];

  return <AppShell>
    <div className="topline">{program.program_tier} · Program v{program.program_version}</div>
    <h1>{snapshot.program_family ?? "โปรแกรมปัจจุบัน"}</h1>
    <p>{valueLabel[snapshot.goal ?? ""] ?? snapshot.goal ?? "–"} · {valueLabel[snapshot.training_experience ?? ""] ?? snapshot.training_experience ?? "–"} · {valueLabel[snapshot.equipment_profile ?? ""] ?? snapshot.equipment_profile ?? "–"} · {displayFocus} · {snapshot.training_days_per_week ?? "–"} วัน · {snapshot.session_duration_min ?? "–"} นาที</p>
    {params.activated && <div className="notice" style={{ marginBottom: 16 }}>เปิดใช้ Program สำเร็จ · เวอร์ชันก่อนหน้าจะถูกเก็บไว้ในประวัติเมื่อมีเวอร์ชันใหม่</div>}
    {autoUpdate && <div className="notice" style={{ marginBottom: 16 }}>
      <strong>Program อัปเดตจากผล LAB · เวอร์ชัน {program.program_version}</strong>
      <p>ผล Exercise Fit ล่าสุดชี้ว่ามีท่า Squat ที่ควรลองมากกว่า ระบบจึงปรับเฉพาะส่วนนี้ของ Program โดยยังเก็บส่วนอื่นไว้เหมือนเดิม</p>
      {autoUpdatePairs.length
        ? autoUpdatePairs.map((pair, index) => <p key={`${pair.from}-${pair.to}-${index}`} style={{ margin: "4px 0" }}><strong>{pair.from} → {pair.to}</strong></p>)
        : autoUpdatedExercises.length ? <p style={{ margin: "4px 0" }}><strong>ท่าปัจจุบัน: {autoUpdatedExercises.join(", ")}</strong></p> : null}
      <p style={{ marginBottom: 0 }}>ท่าอื่น ปริมาณการฝึก และโภชนาการยังเหมือนเดิม · ผลการฝึกจริงยังมีน้ำหนักมากกว่า LAB</p>
    </div>}
    {pendingInputs && <div className="notice warning" style={{ marginBottom: 16 }}>ข้อมูลตั้งค่า Program ปัจจุบันต่างจาก Program v{program.program_version} ที่ใช้อยู่ Program จะยังไม่เปลี่ยนจนกว่าคุณจะดูตัวอย่างและเปิดใช้เวอร์ชันใหม่</div>}

    <div className="grid">
      <div className="card"><div className="kicker">จุดเน้น</div><div className="metric cyan">{displayFocus}</div></div>
      <div className="card"><div className="kicker">เวลาต่อครั้ง</div><div className="metric">{snapshot.session_duration_min ?? "–"} นาที</div></div>
      <div className="card"><div className="kicker">โปรตีน (กรัม/วัน)</div><div className="metric">{nutrition?.protein_low_g ?? "–"}–{nutrition?.protein_high_g ?? "–"} g</div></div>
      <div className="card"><div className="kicker">พลังงาน (กิโลแคลอรี/วัน)</div><div className="metric" style={{ fontSize: "1.15rem" }}>{nutrition?.calorie_low != null ? `${nutrition.calorie_low}–${nutrition.calorie_high}` : "กำลังปรับเทียบ"}</div><p>{nutrition?.maintenance_low != null ? `พลังงานคงน้ำหนัก ${nutrition.maintenance_low}–${nutrition.maintenance_high}` : "ข้อมูลยังไม่พอสำหรับการประมาณครั้งแรก"}</p></div>
    </div>

    {volumeEntries.length ? <section className="card" style={{ marginTop: 18 }}><div className="kicker">เซตหนักโดยตรงต่อสัปดาห์</div><h2>ปริมาณการฝึกรายสัปดาห์</h2><p>{volumeEntries.map(([muscle, sets]) => `${muscleLabel[muscle] ?? muscle}: ${sets}`).join(" · ")}</p></section> : null}

    {isPro && <ProExerciseSuggestions data={proSuggestions} />}

    <ProgramWeek days={Number(snapshot.training_days_per_week ?? byDay.size)} focus={snapshot.primary_focus ?? "BALANCED"} dayLabels={dayLabels} />

    {Array.from(byDay.entries()).map(([day, dayItems]) => {
      const dayLabel = dayItems[0]?.metadata?.day_label ?? `วันที่ฝึก ${day}`;
      return <section className="card day" key={day}>
        <div className="kicker">วันที่ฝึก {day}</div><h2>{dayLabel}</h2>
        {dayItems.map((x) => {
          const label = x.metadata?.display_name ?? x.exercise_key;
          const hasVisual = Boolean(getExerciseVisual(x.exercise_key));
          const updatedFromLab = Boolean(autoUpdate && x.metadata?.auto_update?.kind === "LAB_C1_TARGETED_REFRESH" && x.metadata?.auto_update?.source_result_id === autoUpdate.source_result_id);
          return <div key={x.item_id} style={{ borderBottom: "1px solid rgba(255,255,255,.07)", paddingBottom: 10 }}>
            <div className="exercise" style={{ borderBottom: 0 }}>
              <div style={{ minWidth: 0 }}>
                {updatedFromLab && <small style={{ display: "block", marginBottom: 4 }}><strong>อัปเดตจาก LAB</strong></small>}
                <strong>{label}</strong><br/>
                <small>{x.metadata?.target_label ?? "ท่าฝึก"}{x.metadata?.focus_boost ? " · จุดเน้น" : ""}</small>
                {x.metadata?.progression?.trigger && x.metadata?.progression?.action ? <p style={{ margin: "6px 0 0", fontSize: ".82rem" }}><strong>ถัดไป:</strong> {x.metadata.progression.trigger} → {x.metadata.progression.action}</p> : null}
                {x.metadata?.alternative_name ? <p style={{ margin: "4px 0 0", fontSize: ".78rem", opacity: .72 }}>ตัวเลือก: {x.metadata.alternative_name}</p> : null}
              </div>
              <div>{x.sets} × {x.rep_min}–{x.rep_max} · RIR {x.target_rir}</div>
            </div>
            {(hasVisual || isPro) && <details style={{ margin: "2px 0 8px" }}>
              <summary style={{ cursor: "pointer", fontSize: ".82rem", opacity: .78 }}>
                {hasVisual && isPro ? "ดูท่า · บันทึกผล PRO" : hasVisual ? "ดูท่า" : "บันทึกผล PRO"}
              </summary>
              {hasVisual && <ExerciseVisualPair exerciseKey={x.exercise_key} label={label} />}
              {isPro && <ExerciseFeedbackForm exerciseKey={x.exercise_key} label={label} initial={feedbackMap.get(x.exercise_key) ?? null} />}
            </details>}
          </div>;
        })}
      </section>;
    })}

    {hasRepDbVisuals && <RepDbAttribution />}
    <div className="cta-row"><Link className="btn" href="/program/start">แก้การตั้งค่า Program</Link>{pendingInputs && <Link className="btn primary" href="/program/preview">ดูตัวอย่างเวอร์ชันใหม่</Link>}<Link className="btn" href="/progress">บันทึกความคืบหน้า</Link>{isPro && <Link className="btn" href="/consult">เปิด PRO Review</Link>}</div>
  </AppShell>;
}
