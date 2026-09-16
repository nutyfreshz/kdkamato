type NutritionGuidance = {
  code?: string | null;
  suggested_delta_kcal?: number | null;
  weight_entries?: number | null;
  span_days?: number | null;
  weekly_weight_change_pct?: number | null;
  calorie_low?: number | null;
  calorie_high?: number | null;
  protein_low_g?: number | null;
  protein_high_g?: number | null;
};

export type FreeGuidanceItem = {
  item_id: string;
  exercise_key?: string;
  planned_sets?: number;
  rep_min?: number;
  rep_max?: number;
  target_rir?: number | string;
  action?: string;
  progression?: {
    action?: string | null;
    increment_pct_low?: number | null;
    increment_pct_high?: number | null;
  } | null;
  latest_log?: WorkoutLogSnapshot | null;
  today_log?: WorkoutLogSnapshot | null;
};

export type WorkoutLogSnapshot = {
  entry_date?: string | null;
  set_entries?: Array<{ set?: number; reps?: number; load_kg?: number | null; rir?: number | null }> | null;
  control_status?: string | null;
  issue_status?: string | null;
  optional_note?: string | null;
};

export type FreeAdaptiveGuidance = {
  has_active_program?: boolean;
  global_code?: string | null;
  items?: FreeGuidanceItem[] | null;
  nutrition?: NutritionGuidance | null;
};

function trainingText(code?: string | null) {
  switch (code) {
    case "HOLD_RECOVERY":
      return "การฟื้นตัวยังไม่ดี ครั้งถัดไปยังไม่ต้องเร่งเพิ่มความหนัก";
    case "REVIEW_RECOVERY":
      return "ฟื้นไม่ทันต่อเนื่อง ควรทบทวนความหนักหรือปริมาณการฝึกก่อนเพิ่มต่อ";
    case "REVIEW_ISSUE":
      return "มีปัญหาใหม่จากการฝึก ควรทบทวนก่อนเพิ่มความหนัก";
    case "REVIEW_ADHERENCE":
      return "ช่วงนี้ทำตามโปรแกรมได้น้อย โปรแกรมอาจยังไม่พอดีกับชีวิตจริง";
    case "HOLD_SESSION":
      return "ผลการฝึกล่าสุดแย่ลง ยังไม่ต้องเร่ง progression ในครั้งถัดไป";
    case "REVIEW_SESSION":
      return "ผลการฝึกแย่ลงต่อเนื่อง ควรทบทวนความหนักและปริมาณการฝึก";
    default:
      return "ภาพรวมตอนนี้ยังไปต่อได้ตามแผน ให้โฟกัสคุณภาพของแต่ละเซต";
  }
}

function nutritionText(nutrition?: NutritionGuidance | null) {
  const delta = Math.abs(Number(nutrition?.suggested_delta_kcal ?? 0));
  switch (nutrition?.code) {
    case "CHECK_INTAKE_UP":
      return `ถ้าคุณกินใกล้ช่วงเป้าหมายได้สม่ำเสมอแล้ว ลองเพิ่มพลังงานประมาณ ${delta || 100} kcal/วัน แล้วติดตามแนวโน้มต่อ`;
    case "CHECK_INTAKE_DOWN":
      return `ถ้าคุณกินใกล้ช่วงเป้าหมายได้สม่ำเสมอแล้ว ลองลดพลังงานประมาณ ${delta || 100} kcal/วัน แล้วติดตามแนวโน้มต่อ`;
    case "KEEP":
      return "แนวโน้มน้ำหนักไปในทิศทางที่เหมาะกับเป้าหมาย ใช้ช่วงพลังงานเดิมต่อ";
    case "KEEP_MONITORING":
      return "คงช่วงพลังงานเดิมและติดตามน้ำหนักกับผลการฝึกต่อ ไม่จำเป็นต้องรีบปรับ";
    default:
      return "ข้อมูลน้ำหนักยังไม่ต่อเนื่องพอ ระบบจะยังไม่เดาหรือรีบปรับพลังงานให้คุณ";
  }
}

export function FreeAdaptiveSummary({ guidance }: { guidance?: FreeAdaptiveGuidance | null }) {
  if (!guidance?.has_active_program) return null;
  const nutrition = guidance.nutrition;
  const trend = nutrition?.weekly_weight_change_pct;

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">คำแนะนำจากผลที่บันทึกไว้</div>
      <h2>ครั้งถัดไปควรทำอะไร</h2>
      <div className="grid" style={{ marginTop: 12 }}>
        <div>
          <strong>การฝึก</strong>
          <p style={{ marginBottom: 0 }}>{trainingText(guidance.global_code)}</p>
        </div>
        <div>
          <strong>โภชนาการ</strong>
          <p style={{ marginBottom: 0 }}>{nutritionText(nutrition)}</p>
          {typeof trend === "number" && Number.isFinite(trend) ? (
            <small style={{ opacity: .68 }}>แนวโน้มน้ำหนักประมาณ {trend > 0 ? "+" : ""}{trend}% ต่อสัปดาห์</small>
          ) : null}
        </div>
      </div>
    </section>
  );
}
