"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    goal: "MUSCLE_GAIN", weightKg: "", heightCm: "", ageYears: "", sex: "", trainingExperience: "INTERMEDIATE", trainingDaysPerWeek: "3", equipmentProfile: "FULL_GYM", averageSteps: "", mealFrequency: "3"
  });
  const set = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }));

  async function save() {
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const baseline = {
        user_id: userId,
        goal: form.goal,
        weight_kg: Number(form.weightKg),
        height_cm: form.heightCm ? Number(form.heightCm) : null,
        age_years: form.ageYears ? Number(form.ageYears) : null,
        sex: form.sex || null,
        training_experience: form.trainingExperience,
        training_days_per_week: Number(form.trainingDaysPerWeek),
        equipment_profile: form.equipmentProfile,
      };
      const nutrition = {
        user_id: userId,
        average_steps: form.averageSteps ? Number(form.averageSteps) : null,
        meal_frequency: form.mealFrequency ? Number(form.mealFrequency) : null,
      };
      const [b, n] = await Promise.all([
        supabase.from("user_baseline").upsert(baseline, { onConflict: "user_id" }),
        supabase.from("nutrition_profiles").upsert(nutrition, { onConflict: "user_id" }),
      ]);
      if (b.error) throw b.error;
      if (n.error) throw n.error;
      router.push("/program/preview"); router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally { setBusy(false); }
  }

  return (
    <div className="form">
      <div className="form-grid">
        <label>เป้าหมาย<select value={form.goal} onChange={(e) => set("goal", e.target.value)}><option value="FAT_LOSS">Fat Loss</option><option value="MUSCLE_GAIN">Muscle Gain</option><option value="RECOMPOSITION">Recomposition</option><option value="GENERAL_FITNESS">General Fitness</option></select></label>
        <label>น้ำหนัก (kg)<input inputMode="decimal" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="เช่น 80" /></label>
        <label>ประสบการณ์<select value={form.trainingExperience} onChange={(e) => set("trainingExperience", e.target.value)}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="EXPERIENCED">Experienced</option></select></label>
        <label>ฝึกกี่วัน / สัปดาห์<select value={form.trainingDaysPerWeek} onChange={(e) => set("trainingDaysPerWeek", e.target.value)}><option value="2">2 วัน</option><option value="3">3 วัน</option><option value="4">4+ วัน</option></select></label>
        <label>อุปกรณ์<select value={form.equipmentProfile} onChange={(e) => set("equipmentProfile", e.target.value)}><option value="FULL_GYM">Commercial / Full Gym</option><option value="LIMITED_GYM">Limited Gym</option><option value="HOME_BASIC">Home Basic</option></select></label>
        <label>มื้อ / วัน<select value={form.mealFrequency} onChange={(e) => set("mealFrequency", e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
      </div>
      <div className="notice">ข้อมูลด้านล่างเป็น optional. ไม่ตอบก็ยังสร้าง Training Foundation ได้.</div>
      <div className="form-grid">
        <label>ส่วนสูง (cm)<input inputMode="decimal" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} /></label>
        <label>อายุ<input inputMode="numeric" value={form.ageYears} onChange={(e) => set("ageYears", e.target.value)} /></label>
        <label>เพศสำหรับสมการพลังงาน<select value={form.sex} onChange={(e) => set("sex", e.target.value)}><option value="">ยังไม่ระบุ</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></label>
        <label>Average Steps / day<input inputMode="numeric" value={form.averageSteps} onChange={(e) => set("averageSteps", e.target.value)} placeholder="ถ้ารู้" /></label>
      </div>
      <button className="btn primary" disabled={busy || !(Number(form.weightKg) > 0)} onClick={save}>{busy ? "กำลังบันทึก..." : "Build My Foundation"}</button>
      {error && <div className="notice warning">{error}</div>}
    </div>
  );
}
