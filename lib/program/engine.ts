import type { ProgramExercise, ProgramInput, ProgramPreview } from "./types";

const exercisePools = {
  FULL_GYM: {
    KNEE_DOMINANT: "Hack Squat",
    HIP_HAMSTRING: "Seated Leg Curl",
    HORIZONTAL_PRESS: "Machine Chest Press",
    VERTICAL_PULL: "Lat Pulldown",
    HORIZONTAL_PULL: "Chest-Supported Row",
    SHOULDER: "Cable Lateral Raise",
    ARMS: "Cable Curl + Triceps Pressdown",
  },
  LIMITED_GYM: {
    KNEE_DOMINANT: "Leg Press",
    HIP_HAMSTRING: "Romanian Deadlift",
    HORIZONTAL_PRESS: "Dumbbell Press",
    VERTICAL_PULL: "Assisted Pull-up / Pulldown",
    HORIZONTAL_PULL: "Cable Row",
    SHOULDER: "Dumbbell Lateral Raise",
    ARMS: "Dumbbell Curl + Overhead Extension",
  },
  HOME_BASIC: {
    KNEE_DOMINANT: "Heel-Elevated Goblet Squat",
    HIP_HAMSTRING: "Dumbbell Romanian Deadlift",
    HORIZONTAL_PRESS: "Dumbbell Floor Press",
    VERTICAL_PULL: "Band / Assisted Pull-up",
    HORIZONTAL_PULL: "One-Arm Dumbbell Row",
    SHOULDER: "Dumbbell Lateral Raise",
    ARMS: "Dumbbell Curl + Triceps Extension",
  },
} as const;

const daySlots: Record<string, string[][]> = {
  FB2: [
    ["KNEE_DOMINANT", "HORIZONTAL_PRESS", "VERTICAL_PULL", "HIP_HAMSTRING", "SHOULDER", "ARMS"],
    ["HIP_HAMSTRING", "HORIZONTAL_PRESS", "HORIZONTAL_PULL", "KNEE_DOMINANT", "SHOULDER", "ARMS"],
  ],
  FB3: [
    ["KNEE_DOMINANT", "HORIZONTAL_PRESS", "VERTICAL_PULL", "HIP_HAMSTRING", "SHOULDER"],
    ["HIP_HAMSTRING", "HORIZONTAL_PULL", "HORIZONTAL_PRESS", "KNEE_DOMINANT", "ARMS"],
    ["KNEE_DOMINANT", "VERTICAL_PULL", "HORIZONTAL_PRESS", "HIP_HAMSTRING", "SHOULDER", "ARMS"],
  ],
  UL4: [
    ["HORIZONTAL_PRESS", "VERTICAL_PULL", "HORIZONTAL_PULL", "SHOULDER", "ARMS"],
    ["KNEE_DOMINANT", "HIP_HAMSTRING", "KNEE_DOMINANT", "ARMS"],
    ["HORIZONTAL_PRESS", "HORIZONTAL_PULL", "VERTICAL_PULL", "SHOULDER", "ARMS"],
    ["HIP_HAMSTRING", "KNEE_DOMINANT", "HIP_HAMSTRING", "ARMS"],
  ],
};

function clampTrainingDays(days: number) {
  if (!Number.isFinite(days)) return 3;
  return Math.min(4, Math.max(2, Math.round(days)));
}

function prescription(experience: ProgramInput["trainingExperience"], slot: string) {
  const isolation = slot === "SHOULDER" || slot === "ARMS";
  if (experience === "BEGINNER") {
    return { sets: 2, repMin: isolation ? 10 : 8, repMax: isolation ? 20 : 12, targetRir: 3 };
  }
  if (experience === "EXPERIENCED") {
    return { sets: isolation ? 2 : 3, repMin: isolation ? 10 : 6, repMax: isolation ? 20 : 12, targetRir: isolation ? 1 : 2 };
  }
  return { sets: isolation ? 2 : 3, repMin: isolation ? 10 : 6, repMax: isolation ? 20 : 12, targetRir: 2 };
}

export function buildProgramPreview(input: ProgramInput): ProgramPreview {
  const days = clampTrainingDays(input.trainingDaysPerWeek);
  const familyKey = days === 2 ? "FB2" : days === 3 ? "FB3" : "UL4";
  const family = days === 2 ? "Full Body A/B" : days === 3 ? "Full Body A/B/C" : "Upper / Lower 4-Day";
  const pool = exercisePools[input.equipmentProfile] ?? exercisePools.FULL_GYM;

  const exercises: ProgramExercise[] = daySlots[familyKey].flatMap((slots, dayIndex) =>
    slots.map((slot) => {
      const p = prescription(input.trainingExperience, slot);
      return {
        day: dayIndex + 1,
        slot,
        name: pool[slot as keyof typeof pool],
        ...p,
      };
    }),
  );

  const proteinLowG = Math.round(input.weightKg * 1.6);
  const proteinHighG = Math.round(input.weightKg * 2.0);
  const energyInputsReady = Boolean(
    input.averageSteps != null &&
      input.heightCm != null &&
      input.ageYears != null &&
      input.sex != null,
  );

  return {
    family,
    days,
    exercises,
    nutrition: {
      status: energyInputsReady ? "ESTIMATE_READY" : "NEEDS_MORE_INPUT",
      message: energyInputsReady
        ? "มีข้อมูลพอสำหรับส่งต่อไปยัง nutrition-target calculation ฝั่ง server โดยไม่ใช้ activity multiplier แบบ subjective"
        : "Training Program สร้างได้แล้ว ส่วน calorie range จะขอเฉพาะข้อมูลที่ยังขาดเมื่อจำเป็น แทนการเดา activity level",
      proteinLowG,
      proteinHighG,
    },
    guardrails: [
      "นี่คือ starting prescription ไม่ใช่ individual optimal volume",
      "Exercise option เป็นตัวเลือกมาตรฐานจาก Goal + Equipment + Basic Constraints ไม่ใช่คำตัดสินจาก anatomy",
      "ปรับจาก observed response ภายหลัง ไม่บังคับ deload ตามจำนวนสัปดาห์ตายตัว",
    ],
  };
}
