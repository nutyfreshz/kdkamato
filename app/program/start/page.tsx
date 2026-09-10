import { AppShell } from "@/components/app-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

function focusFromProfile(p: unknown) {
  if (typeof p === "string") return p.toUpperCase();
  if (Array.isArray(p)) return String(p[0] ?? "").toUpperCase();
  if (p && typeof p === "object") {
    const x = p as Record<string, unknown>;
    return String(x.primary ?? x.focus ?? x.primary_focus ?? "").toUpperCase();
  }
  return "BALANCED";
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

export default async function ProgramStartPage() {
  const user = await requireUser();
  if (!user) return <AppShell><div className="notice warning">ระบบเชื่อมต่อบัญชีไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ภายหลัง</div></AppShell>;

  const supabase = await createClient();
  const [{ data: baseline }, { data: training }, { data: nutrition }] = await Promise.all([
    supabase.from("user_baseline").select("goal,weight_kg,height_cm,age_years,sex,training_experience,training_days_per_week,equipment_profile").eq("user_id", user.id).maybeSingle(),
    supabase.from("training_profiles").select("session_duration_min,priority_muscles").eq("user_id", user.id).maybeSingle(),
    supabase.from("nutrition_profiles").select("average_steps,cardio_minutes_per_week").eq("user_id", user.id).maybeSingle(),
  ]);

  const initial = baseline ? {
    goal: text(baseline.goal),
    trainingFocus: focusFromProfile(training?.priority_muscles),
    weightKg: text(baseline.weight_kg),
    heightCm: text(baseline.height_cm),
    ageYears: text(baseline.age_years),
    sex: text(baseline.sex),
    trainingExperience: text(baseline.training_experience),
    trainingDaysPerWeek: text(baseline.training_days_per_week),
    equipmentProfile: text(baseline.equipment_profile),
    averageSteps: text(nutrition?.average_steps),
    sessionDurationMin: text(training?.session_duration_min || 60),
    cardioMinutesPerWeek: text(nutrition?.cardio_minutes_per_week),
  } : undefined;

  return <AppShell>
    <div className="topline">ตั้งค่า Program</div>
    <h1>ตั้งค่า Program ให้ตรงกับเป้าหมายและเวลาฝึกของคุณ</h1>
    <p>ระบบจะใช้เป้าหมาย จุดเน้น จำนวนวันฝึก ประสบการณ์ อุปกรณ์ และเวลาฝึกต่อครั้ง เพื่อกำหนดปริมาณการฝึกรายสัปดาห์และเลือกท่าฝึกให้เหมาะกับคุณ</p>
    <OnboardingForm initial={initial} />
  </AppShell>;
}
