"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FreeGuidanceItem, WorkoutLogSnapshot } from "@/components/free-adaptive-summary";

type SetInput = { load: string; reps: string; rir: string };

function actionText(item?: FreeGuidanceItem | null) {
  const low = Number(item?.progression?.increment_pct_low ?? NaN);
  const high = Number(item?.progression?.increment_pct_high ?? NaN);
  switch (item?.action) {
    case "PROGRESS_LOAD":
      if (Number.isFinite(low) && Number.isFinite(high)) return `เพิ่มน้ำหนักประมาณ ${low}–${high}% ได้`;
      return "เพิ่มความยากของท่าหรือเพิ่มน้ำหนักเล็กน้อยได้";
    case "READY_TO_PROGRESS":
      return "ถึงช่วงบนของจำนวนครั้งแล้ว ถ้าคุมท่าได้ดี ให้เพิ่มน้ำหนักเล็กน้อย";
    case "HOLD_CONTROL":
      return "คงน้ำหนักเดิมก่อน แล้วทำให้ท่านิ่งและคุมช่วงลงได้ดีขึ้น";
    case "BUILD_REPS":
      return "ใช้น้ำหนักเดิม แล้วค่อย ๆ เพิ่มจำนวนครั้งโดยยังคุมท่าได้";
    case "COMPLETE_TARGET":
      return "ทำจำนวนเซตให้ครบตามแผนก่อน แล้วค่อยเพิ่มความยาก";
    case "REDUCE_LOAD":
      return "ลดน้ำหนักเล็กน้อย เพื่อกลับเข้าเป้าจำนวนครั้งโดยยังคุมท่าได้";
    case "REVIEW_EXERCISE":
      return "ยังไม่ต้องฝืนท่านี้ มีสัญญาณว่าควรทบทวนท่าหรือวิธีทำก่อน";
    case "REVIEW_PROGRAM":
      return "ยังไม่ต้องเร่ง progression มีสัญญาณจากหลายครั้งว่าควรทบทวนโปรแกรม";
    case "HOLD_RECOVERY":
      return "คงเดิมก่อน รอให้การฟื้นตัวกลับมาดีแล้วค่อยเพิ่มความหนัก";
    case "HOLD_EFFORT":
      return "ถึงจำนวนครั้งเป้าแล้ว แต่เซ็ตหนักเกินไป คงน้ำหนักเดิมก่อน";
    default:
      return "ทำตามช่วงจำนวนครั้งและเหลือแรงที่กำหนดก่อน";
  }
}

function initialRows(plannedSets: number, initial?: WorkoutLogSnapshot | null): SetInput[] {
  const existing = initial?.set_entries ?? [];
  return Array.from({ length: plannedSets }, (_, index) => {
    const row = existing[index];
    return {
      load: row?.load_kg == null ? "" : String(row.load_kg),
      reps: row?.reps == null ? "" : String(row.reps),
      rir: row?.rir == null ? "" : String(row.rir),
    };
  });
}

function readableError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "บันทึกไม่สำเร็จ");
  }
  return "บันทึกไม่สำเร็จ";
}

export function WorkoutLogForm({
  itemId,
  label,
  plannedSets,
  repMin,
  repMax,
  targetRir,
  guidance,
}: {
  itemId: string;
  label: string;
  plannedSets: number;
  repMin: number;
  repMax: number;
  targetRir: number | string;
  guidance?: FreeGuidanceItem | null;
}) {
  const router = useRouter();
  const initial = guidance?.today_log ?? null;
  const [rows, setRows] = useState<SetInput[]>(() => initialRows(plannedSets, initial));
  const [control, setControl] = useState(initial?.control_status ?? "");
  const [issue, setIssue] = useState(initial?.issue_status ?? "NONE");
  const [note, setNote] = useState(initial?.optional_note ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const hasReps = useMemo(() => rows.some((row) => Number(row.reps) > 0), [rows]);

  function updateRow(index: number, key: keyof SetInput, value: string) {
    setRows((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  async function save() {
    if (busy || !hasReps) return;
    const setEntries = rows
      .filter((row) => Number(row.reps) > 0)
      .map((row) => ({
        reps: Number(row.reps),
        load_kg: row.load.trim() === "" ? null : Number(row.load),
        rir: row.rir.trim() === "" ? null : Number(row.rir),
      }));

    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase.rpc("save_my_workout_exercise_log", {
        p_item_id: itemId,
        p_set_entries: setEntries,
        p_control_status: control || null,
        p_issue_status: issue || "NONE",
        p_optional_note: note.trim() || null,
        p_entry_date: null,
      });
      if (saveError) throw saveError;
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form" style={{ marginTop: 10 }}>
      <div className="notice" style={{ marginBottom: 12 }}>
        <strong>ครั้งถัดไป:</strong> {actionText(guidance)}
      </div>
      <p style={{ marginTop: 0 }}>
        บันทึกเฉพาะเซตฝึกจริงของ {label} ไม่รวมวอร์มอัพ · เป้าหมาย {repMin}–{repMax} ครั้ง · เหลือแรงประมาณ {targetRir} ครั้ง
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((row, index) => (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "30px repeat(3, minmax(0, 1fr))", gap: 6, alignItems: "end", minWidth: 0 }}>
            <strong style={{ paddingBottom: 10 }}>#{index + 1}</strong>
            <label style={{ margin: 0, minWidth: 0 }}>กก.<input inputMode="decimal" value={row.load} onChange={(e) => updateRow(index, "load", e.target.value)} placeholder="–" /></label>
            <label style={{ margin: 0, minWidth: 0 }}>ครั้ง<input inputMode="numeric" value={row.reps} onChange={(e) => updateRow(index, "reps", e.target.value)} placeholder={`${repMin}`} /></label>
            <label style={{ margin: 0, minWidth: 0 }}>เหลือแรง<input inputMode="decimal" value={row.rir} onChange={(e) => updateRow(index, "rir", e.target.value)} placeholder={`${targetRir}`} /></label>
          </div>
        ))}
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <label>การควบคุมท่า
          <select value={control} onChange={(e) => setControl(e.target.value)}>
            <option value="">ไม่ระบุ</option>
            <option value="GOOD">คุมได้ดี</option>
            <option value="OK">พอใช้</option>
            <option value="POOR">ยังไม่นิ่ง</option>
          </select>
        </label>
        <label>มีอาการผิดปกติไหม
          <select value={issue} onChange={(e) => setIssue(e.target.value)}>
            <option value="NONE">ไม่มี</option>
            <option value="DISCOMFORT">รู้สึกฝืนหรือไม่สบาย</option>
            <option value="PAIN">เจ็บ</option>
          </select>
        </label>
      </div>

      <label>หมายเหตุ (ไม่บังคับ)
        <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ช่วงลงยังคุมยาก หรือกล้ามเป้าหมายทำงานชัดขึ้น" />
      </label>

      <button className="btn primary" type="button" disabled={busy || !hasReps} onClick={save}>
        {busy ? "กำลังบันทึก..." : "บันทึกการฝึกท่านี้"}
      </button>
      {saved && <div className="notice" role="status" aria-live="polite">บันทึกแล้ว · คำแนะนำครั้งถัดไปอัปเดตจากผลจริงของคุณ</div>}
      {error && <div className="notice warning" role="alert">{error}</div>}
    </div>
  );
}
