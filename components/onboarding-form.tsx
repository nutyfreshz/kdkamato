"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InitialFoundation = {
  goal?: string;
  trainingFocus?: string;
  weightKg?: string;
  heightCm?: string;
  ageYears?: string;
  sex?: string;
  trainingExperience?: string;
  trainingDaysPerWeek?: string;
  equipmentProfile?: string;
  averageSteps?: string;
  sessionDurationMin?: string;
  cardioMinutesPerWeek?: string;
};

function readableError(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message?: unknown }).message ?? "บันทึกไม่สำเร็จ");
  return "บันทึกไม่สำเร็จ";
}

function optionalNumber(value: string) {
  return value.trim() === "" ? null : Number(value);
}

export function OnboardingForm({ initial = {} }: { initial?: InitialFoundation }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    goal: initial.goal ?? "MUSCLE_GAIN",
    trainingFocus: initial.trainingFocus ?? "BALANCED",
    weightKg: initial.weightKg ?? "",
    heightCm: initial.heightCm ?? "",
    ageYears: initial.ageYears ?? "",
    sex: initial.sex ?? "",
    trainingExperience: initial.trainingExperience ?? "INTERMEDIATE",
    trainingDaysPerWeek: initial.trainingDaysPerWeek ?? "4",
    equipmentProfile: initial.equipmentProfile ?? "FULL_GYM",
    averageSteps: initial.averageSteps ?? "",
    sessionDurationMin: initial.sessionDurationMin ?? "60",
    cardioMinutesPerWeek: initial.cardioMinutesPerWeek ?? "",
  });

  const set = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }));

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase.rpc("save_my_free_foundation", {
        p_goal: form.goal,
        p_weight_kg: Number(form.weightKg),
        p_training_experience: form.trainingExperience,
        p_training_days_per_week: Number(form.trainingDaysPerWeek),
        p_equipment_profile: form.equipmentProfile,
        p_training_focus: form.trainingFocus,
        p_session_duration_min: Number(form.sessionDurationMin),
        p_height_cm: optionalNumber(form.heightCm),
        p_age_years: optionalNumber(form.ageYears),
        p_sex: form.sex || null,
        p_average_steps: optionalNumber(form.averageSteps),
        p_cardio_minutes_per_week: optionalNumber(form.cardioMinutesPerWeek),
      });
      if (saveError) throw saveError;
      router.push("/program/preview");
      router.refresh();
    } catch (e) {
      setError(readableError(e));
      setBusy(false);
    }
  }

  return (
    <div className="form">
      <div className="form-grid">
        <label>เป้าหมาย<select value={form.goal} onChange={(e) => set("goal", e.target.value)}><option value="MUSCLE_GAIN">เพิ่มกล้ามเนื้อ</option><option value="FAT_LOSS">ลดไขมัน</option><option value="RECOMPOSITION">ปรับองค์ประกอบร่างกาย</option><option value="GENERAL_FITNESS">ฟิตเนสทั่วไป</option></select></label>
        <label>ส่วนที่อยากเน้น<select value={form.trainingFocus} onChange={(e) => set("trainingFocus", e.target.value)}><option value="BALANCED">สมดุลทั้งตัว</option><option value="CHEST">เน้นหน้าอก</option><option value="BACK">เน้นหลัง</option><option value="ARMS">เน้นแขน</option><option value="LEGS">เน้นขา</option><option value="REPOSTURE">ปรับท่าทาง / สมดุลหัวไหล่</option></select></label>
        <label>น้ำหนัก (กก.)<input inputMode="decimal" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="เช่น 80" /></label>
        <label>ประสบการณ์การฝึก<select value={form.trainingExperience} onChange={(e) => set("trainingExperience", e.target.value)}><option value="BEGINNER">เริ่มต้น</option><option value="INTERMEDIATE">ระดับกลาง</option><option value="EXPERIENCED">มีประสบการณ์</option></select></label>
        <label>จำนวนวันฝึกต่อสัปดาห์<select value={form.trainingDaysPerWeek} onChange={(e) => set("trainingDaysPerWeek", e.target.value)}><option value="2">2 วัน</option><option value="3">3 วัน</option><option value="4">4 วัน</option><option value="5">5 วัน</option><option value="6">6 วัน</option></select></label>
        <label>เวลาฝึกเฉลี่ยต่อครั้ง<select value={form.sessionDurationMin} onChange={(e) => set("sessionDurationMin", e.target.value)}><option value="45">ประมาณ 45 นาที</option><option value="60">ประมาณ 60 นาที</option><option value="75">ประมาณ 75 นาที</option><option value="90">ประมาณ 90 นาที</option></select></label>
        <label>อุปกรณ์ที่ใช้งานได้<select value={form.equipmentProfile} onChange={(e) => set("equipmentProfile", e.target.value)}><option value="FULL_GYM">ฟิตเนสครบวงจร</option><option value="LIMITED_GYM">ฟิตเนสจำกัดอุปกรณ์</option><option value="HOME_BASIC">อุปกรณ์พื้นฐานที่บ้าน</option></select></label>
      </div>

      <div className="notice">จุดเน้นมีผลต่อจำนวนเซตหนักโดยตรงและการจัดท่าใน Program จริง ตัวเลือกปรับท่าทาง/สมดุลหัวไหล่จะเน้นกล้ามเนื้อหลังส่วนบน ด้านหลังหัวไหล่ ข้อต่อหัวไหล่ และกล้ามเนื้อควบคุมสะบัก เพื่อเพิ่มสมดุลของหัวไหล่และสะบัก แต่ไม่ใช่การฟื้นฟูหรือรักษาอาการปวด</div>

      <div className="form-grid">
        <label>ส่วนสูง (ซม.)<input inputMode="decimal" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} /></label>
        <label>อายุ<input inputMode="numeric" value={form.ageYears} onChange={(e) => set("ageYears", e.target.value)} /></label>
        <label>เพศสำหรับใช้คำนวณพลังงาน<select value={form.sex} onChange={(e) => set("sex", e.target.value)}><option value="">ยังไม่ระบุ</option><option value="MALE">ชาย</option><option value="FEMALE">หญิง</option></select></label>
        <label>จำนวนก้าวเฉลี่ยต่อวัน<input inputMode="numeric" value={form.averageSteps} onChange={(e) => set("averageSteps", e.target.value)} placeholder="ถ้าทราบ" /></label>
        <label>คาร์ดิโอ (นาทีต่อสัปดาห์)<input inputMode="numeric" value={form.cardioMinutesPerWeek} onChange={(e) => set("cardioMinutesPerWeek", e.target.value)} placeholder="ถ้ามี" /></label>
      </div>

      <div className="notice">การประมาณพลังงานเป็นข้อมูลเสริม หากข้อมูลที่วัดได้ยังไม่เพียงพอ ระบบจะไม่เดาระดับกิจกรรมหรือแสดงตัวเลขที่ดูแม่นยำเกินจริง</div>

      <button className="btn primary" disabled={busy || !(Number(form.weightKg) > 0)} onClick={save}>{busy ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูลและดูตัวอย่าง"}</button>
      {busy && <div className="notice" role="status" aria-live="polite">กำลังบันทึกข้อมูลและเตรียมตัวอย่างโปรแกรม</div>}
      {error && <div className="notice warning" role="alert">{error}</div>}
    </div>
  );
}
