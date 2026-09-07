import { createClient } from "npm:@supabase/supabase-js@2.115.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getKey(pluralName: string, legacyName: string) {
  const raw = Deno.env.get(pluralName);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.default) return parsed.default;
      const first = Object.values(parsed)[0];
      if (first) return first;
    } catch {
      // fall through to legacy variable
    }
  }
  return Deno.env.get(legacyName) ?? "";
}

type Baseline = {
  goal: string;
  weight_kg: number | string;
  height_cm: number | string | null;
  age_years: number | null;
  sex: string | null;
  training_experience: string;
  training_days_per_week: number;
  equipment_profile: string;
  body_fat_pct: number | string | null;
  body_fat_method: string | null;
};

type NutritionProfile = {
  average_steps: number | null;
  cardio_minutes_per_week: number | null;
  cardio_type: string | null;
  meal_frequency: number | null;
  current_calories: number | string | null;
};

type TrainingProfile = {
  session_duration_min: number | null;
};

type ExerciseOption = {
  key: string;
  name: string;
  focus: string;
};

type SlotSpec = {
  slot: string;
  muscle: string;
  priority: 1 | 2 | 3 | 4;
};

type TrainingItem = {
  training_day: number;
  movement_slot: string;
  exercise_key: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  target_rir: number;
  display_order: number;
  metadata: Record<string, unknown>;
};

type VolumeTargets = Record<string, number>;

const ENGINE_VERSION = "FREE_FOUNDATION_V0.3";

const pools: Record<string, Record<string, ExerciseOption[]>> = {
  FULL_GYM: {
    KNEE_DOMINANT: [
      { key: "HACK_SQUAT", name: "Hack Squat", focus: "Quads" },
      { key: "LEG_PRESS", name: "Leg Press", focus: "Quads" },
      { key: "LEG_EXTENSION", name: "Leg Extension", focus: "Quads" },
    ],
    HIP_HAMSTRING: [
      { key: "SEATED_LEG_CURL", name: "Seated Leg Curl", focus: "Hamstrings" },
      { key: "ROMANIAN_DEADLIFT", name: "Romanian Deadlift", focus: "Hamstrings / Glutes" },
      { key: "HIP_THRUST", name: "Hip Thrust", focus: "Glutes / Hip extensors" },
    ],
    HORIZONTAL_PRESS: [
      { key: "MACHINE_CHEST_PRESS", name: "Machine Chest Press", focus: "Chest" },
      { key: "INCLINE_MACHINE_PRESS", name: "Incline Machine Press", focus: "Upper chest" },
      { key: "SMITH_PRESS", name: "Smith Press", focus: "Chest" },
    ],
    VERTICAL_PULL: [
      { key: "LAT_PULLDOWN", name: "Lat Pulldown", focus: "Lats / Upper back" },
      { key: "MACHINE_PULLDOWN", name: "Machine Pulldown", focus: "Lats" },
      { key: "ASSISTED_PULLUP", name: "Assisted Pull-up", focus: "Lats / Upper back" },
    ],
    HORIZONTAL_PULL: [
      { key: "CHEST_SUPPORTED_ROW", name: "Chest-Supported Row", focus: "Mid / Upper back" },
      { key: "MACHINE_ROW", name: "Machine Row", focus: "Mid back" },
      { key: "CABLE_ROW", name: "Cable Row", focus: "Mid back" },
    ],
    SHOULDER: [
      { key: "CABLE_LATERAL_RAISE", name: "Cable Lateral Raise", focus: "Side delts" },
      { key: "MACHINE_LATERAL_RAISE", name: "Machine Lateral Raise", focus: "Side delts" },
      { key: "MACHINE_SHOULDER_PRESS", name: "Machine Shoulder Press", focus: "Shoulders" },
    ],
    BICEPS: [
      { key: "CABLE_CURL", name: "Cable Curl", focus: "Biceps" },
      { key: "MACHINE_CURL", name: "Machine Curl", focus: "Biceps" },
      { key: "INCLINE_DB_CURL", name: "Incline Dumbbell Curl", focus: "Biceps" },
    ],
    TRICEPS: [
      { key: "CABLE_PRESSDOWN", name: "Cable Pressdown", focus: "Triceps" },
      { key: "OVERHEAD_CABLE_EXTENSION", name: "Overhead Cable Extension", focus: "Triceps" },
      { key: "MACHINE_DIP", name: "Machine Dip", focus: "Triceps" },
    ],
    CALVES: [
      { key: "SEATED_CALF_RAISE", name: "Seated Calf Raise", focus: "Calves" },
      { key: "STANDING_CALF_RAISE", name: "Standing Calf Raise", focus: "Calves" },
    ],
    CORE: [
      { key: "CABLE_CRUNCH", name: "Cable Crunch", focus: "Core" },
      { key: "MACHINE_CRUNCH", name: "Machine Crunch", focus: "Core" },
      { key: "PALLOF_PRESS", name: "Pallof Press", focus: "Core stability" },
    ],
  },
  LIMITED_GYM: {
    KNEE_DOMINANT: [
      { key: "LEG_PRESS", name: "Leg Press", focus: "Quads" },
      { key: "HEEL_ELEVATED_DB_SQUAT", name: "Heel-Elevated Dumbbell Squat", focus: "Quads" },
      { key: "DB_SPLIT_SQUAT", name: "Dumbbell Split Squat", focus: "Quads / Glutes" },
    ],
    HIP_HAMSTRING: [
      { key: "ROMANIAN_DEADLIFT", name: "Romanian Deadlift", focus: "Hamstrings / Glutes" },
      { key: "DB_ROMANIAN_DEADLIFT", name: "Dumbbell Romanian Deadlift", focus: "Hamstrings / Glutes" },
      { key: "DB_HIP_THRUST", name: "Dumbbell Hip Thrust", focus: "Glutes / Hip extensors" },
    ],
    HORIZONTAL_PRESS: [
      { key: "DUMBBELL_PRESS", name: "Dumbbell Press", focus: "Chest" },
      { key: "INCLINE_DB_PRESS", name: "Incline Dumbbell Press", focus: "Upper chest" },
      { key: "PUSHUP", name: "Push-up", focus: "Chest / Triceps" },
    ],
    VERTICAL_PULL: [
      { key: "ASSISTED_PULLUP_OR_PULLDOWN", name: "Assisted Pull-up / Pulldown", focus: "Lats / Upper back" },
      { key: "LAT_PULLDOWN", name: "Lat Pulldown", focus: "Lats" },
    ],
    HORIZONTAL_PULL: [
      { key: "CABLE_ROW", name: "Cable Row", focus: "Mid back" },
      { key: "ONE_ARM_DB_ROW", name: "One-Arm Dumbbell Row", focus: "Lats / Mid back" },
    ],
    SHOULDER: [
      { key: "DUMBBELL_LATERAL_RAISE", name: "Dumbbell Lateral Raise", focus: "Side delts" },
      { key: "DB_SHOULDER_PRESS", name: "Dumbbell Shoulder Press", focus: "Shoulders" },
    ],
    BICEPS: [
      { key: "DB_CURL", name: "Dumbbell Curl", focus: "Biceps" },
      { key: "HAMMER_CURL", name: "Hammer Curl", focus: "Biceps / Brachialis" },
    ],
    TRICEPS: [
      { key: "OVERHEAD_DB_EXTENSION", name: "Overhead Dumbbell Extension", focus: "Triceps" },
      { key: "CABLE_PRESSDOWN", name: "Cable Pressdown", focus: "Triceps" },
    ],
    CALVES: [
      { key: "DB_STANDING_CALF_RAISE", name: "Dumbbell Standing Calf Raise", focus: "Calves" },
    ],
    CORE: [
      { key: "DEAD_BUG", name: "Dead Bug", focus: "Core stability" },
      { key: "PLANK", name: "Plank", focus: "Core stability" },
    ],
  },
  HOME_BASIC: {
    KNEE_DOMINANT: [
      { key: "HEEL_ELEVATED_GOBLET_SQUAT", name: "Heel-Elevated Goblet Squat", focus: "Quads" },
      { key: "DB_SPLIT_SQUAT", name: "Dumbbell Split Squat", focus: "Quads / Glutes" },
      { key: "REVERSE_LUNGE", name: "Reverse Lunge", focus: "Quads / Glutes" },
    ],
    HIP_HAMSTRING: [
      { key: "DB_ROMANIAN_DEADLIFT", name: "Dumbbell Romanian Deadlift", focus: "Hamstrings / Glutes" },
      { key: "DB_HIP_THRUST", name: "Dumbbell Hip Thrust", focus: "Glutes / Hip extensors" },
      { key: "SLIDER_LEG_CURL", name: "Slider Leg Curl", focus: "Hamstrings" },
    ],
    HORIZONTAL_PRESS: [
      { key: "DB_FLOOR_PRESS", name: "Dumbbell Floor Press", focus: "Chest / Triceps" },
      { key: "PUSHUP", name: "Push-up", focus: "Chest / Triceps" },
      { key: "INCLINE_PUSHUP", name: "Incline Push-up", focus: "Chest / Triceps" },
    ],
    VERTICAL_PULL: [
      { key: "BAND_OR_ASSISTED_PULLUP", name: "Band / Assisted Pull-up", focus: "Lats / Upper back" },
      { key: "BAND_LAT_PULLDOWN", name: "Band Lat Pulldown", focus: "Lats" },
    ],
    HORIZONTAL_PULL: [
      { key: "ONE_ARM_DB_ROW", name: "One-Arm Dumbbell Row", focus: "Lats / Mid back" },
      { key: "BAND_ROW", name: "Band Row", focus: "Mid back" },
    ],
    SHOULDER: [
      { key: "DUMBBELL_LATERAL_RAISE", name: "Dumbbell Lateral Raise", focus: "Side delts" },
      { key: "DB_SHOULDER_PRESS", name: "Dumbbell Shoulder Press", focus: "Shoulders" },
    ],
    BICEPS: [
      { key: "DB_CURL", name: "Dumbbell Curl", focus: "Biceps" },
      { key: "HAMMER_CURL", name: "Hammer Curl", focus: "Biceps / Brachialis" },
    ],
    TRICEPS: [
      { key: "DB_TRICEPS_EXTENSION", name: "Dumbbell Triceps Extension", focus: "Triceps" },
      { key: "CLOSE_GRIP_PUSHUP", name: "Close-Grip Push-up", focus: "Triceps" },
    ],
    CALVES: [
      { key: "SINGLE_LEG_CALF_RAISE", name: "Single-Leg Calf Raise", focus: "Calves" },
    ],
    CORE: [
      { key: "DEAD_BUG", name: "Dead Bug", focus: "Core stability" },
      { key: "PLANK", name: "Plank", focus: "Core stability" },
    ],
  },
};

const templates: Record<string, SlotSpec[][]> = {
  FB2: [
    [
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 1 },
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "VERTICAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 2 },
      { slot: "SHOULDER", muscle: "SHOULDERS", priority: 3 },
      { slot: "TRICEPS", muscle: "TRICEPS", priority: 4 },
    ],
    [
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 1 },
      { slot: "HORIZONTAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 2 },
      { slot: "SHOULDER", muscle: "SHOULDERS", priority: 3 },
      { slot: "BICEPS", muscle: "BICEPS", priority: 4 },
    ],
  ],
  FB3: [
    [
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 1 },
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "VERTICAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 2 },
      { slot: "SHOULDER", muscle: "SHOULDERS", priority: 3 },
    ],
    [
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 1 },
      { slot: "HORIZONTAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 2 },
      { slot: "BICEPS", muscle: "BICEPS", priority: 4 },
      { slot: "CORE", muscle: "CORE", priority: 4 },
    ],
    [
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 1 },
      { slot: "VERTICAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 2 },
      { slot: "SHOULDER", muscle: "SHOULDERS", priority: 3 },
      { slot: "TRICEPS", muscle: "TRICEPS", priority: 4 },
    ],
  ],
  UL4: [
    [
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "VERTICAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "HORIZONTAL_PULL", muscle: "BACK", priority: 2 },
      { slot: "SHOULDER", muscle: "SHOULDERS", priority: 3 },
      { slot: "BICEPS", muscle: "BICEPS", priority: 4 },
      { slot: "TRICEPS", muscle: "TRICEPS", priority: 4 },
    ],
    [
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 1 },
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 1 },
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 2 },
      { slot: "CALVES", muscle: "CALVES", priority: 4 },
      { slot: "CORE", muscle: "CORE", priority: 4 },
    ],
    [
      { slot: "HORIZONTAL_PRESS", muscle: "CHEST", priority: 1 },
      { slot: "HORIZONTAL_PULL", muscle: "BACK", priority: 1 },
      { slot: "VERTICAL_PULL", muscle: "BACK", priority: 2 },
      { slot: "SHOULDER", muscle: "SHOULDERS", priority: 3 },
      { slot: "TRICEPS", muscle: "TRICEPS", priority: 4 },
      { slot: "BICEPS", muscle: "BICEPS", priority: 4 },
    ],
    [
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 1 },
      { slot: "KNEE_DOMINANT", muscle: "QUADS", priority: 1 },
      { slot: "HIP_HAMSTRING", muscle: "HAMSTRINGS", priority: 2 },
      { slot: "CALVES", muscle: "CALVES", priority: 4 },
      { slot: "CORE", muscle: "CORE", priority: 4 },
    ],
  ],
};

function clampDays(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(4, Math.max(2, Math.round(value)));
}

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round50(value: number) {
  return Math.round(value / 50) * 50;
}

function goalName(goal: string) {
  if (goal === "FAT_LOSS") return "Fat Loss";
  if (goal === "RECOMPOSITION") return "Recomposition";
  if (goal === "GENERAL_FITNESS") return "General Fitness";
  return "Muscle Gain";
}

function familyName(days: number) {
  return days === 2 ? "Full Body A/B" : days === 3 ? "Full Body A/B/C" : "Upper / Lower 4-Day";
}

function foundationLabel(goal: string) {
  if (goal === "FAT_LOSS") return "Performance-Retention Foundation";
  if (goal === "RECOMPOSITION") return "Recomposition Foundation";
  if (goal === "GENERAL_FITNESS") return "General Fitness Foundation";
  return "Hypertrophy Foundation";
}

function volumeTargets(goal: string, experience: string): VolumeTargets {
  const beginner: Record<string, VolumeTargets> = {
    MUSCLE_GAIN: { CHEST: 6, BACK: 8, QUADS: 6, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
    RECOMPOSITION: { CHEST: 6, BACK: 8, QUADS: 6, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
    FAT_LOSS: { CHEST: 5, BACK: 7, QUADS: 5, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 3, TRICEPS: 3, CALVES: 3, CORE: 3 },
    GENERAL_FITNESS: { CHEST: 5, BACK: 7, QUADS: 5, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 3, TRICEPS: 3, CALVES: 3, CORE: 3 },
  };
  const intermediate: Record<string, VolumeTargets> = {
    MUSCLE_GAIN: { CHEST: 6, BACK: 10, QUADS: 8, HAMSTRINGS: 6, SHOULDERS: 6, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
    RECOMPOSITION: { CHEST: 6, BACK: 9, QUADS: 7, HAMSTRINGS: 5, SHOULDERS: 4, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
    FAT_LOSS: { CHEST: 6, BACK: 8, QUADS: 6, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
    GENERAL_FITNESS: { CHEST: 6, BACK: 8, QUADS: 6, HAMSTRINGS: 4, SHOULDERS: 4, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
  };
  const experienced: Record<string, VolumeTargets> = {
    MUSCLE_GAIN: { CHEST: 8, BACK: 12, QUADS: 9, HAMSTRINGS: 8, SHOULDERS: 6, BICEPS: 6, TRICEPS: 6, CALVES: 6, CORE: 4 },
    RECOMPOSITION: { CHEST: 8, BACK: 10, QUADS: 8, HAMSTRINGS: 6, SHOULDERS: 5, BICEPS: 5, TRICEPS: 5, CALVES: 5, CORE: 4 },
    FAT_LOSS: { CHEST: 7, BACK: 9, QUADS: 7, HAMSTRINGS: 5, SHOULDERS: 5, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
    GENERAL_FITNESS: { CHEST: 7, BACK: 9, QUADS: 7, HAMSTRINGS: 5, SHOULDERS: 5, BICEPS: 4, TRICEPS: 4, CALVES: 4, CORE: 4 },
  };
  const key = goal in intermediate ? goal : "MUSCLE_GAIN";
  if (experience === "BEGINNER") return beginner[key];
  if (experience === "EXPERIENCED") return experienced[key];
  return intermediate[key];
}

function trimTemplate(familyKey: string, sessionDurationMin: number | null) {
  const duration = sessionDurationMin ?? 60;
  return templates[familyKey].map((day) => {
    if (duration <= 45) return day.filter((x) => x.priority <= 3).slice(0, 5);
    if (duration <= 60) return day.slice(0, 6);
    return day;
  });
}

function prescription(experience: string, slot: string, goal: string, sets: number) {
  const isolation = ["SHOULDER", "BICEPS", "TRICEPS", "CALVES", "CORE"].includes(slot);
  const beginner = experience === "BEGINNER";
  const experienced = experience === "EXPERIENCED";
  const repMin = isolation ? 10 : beginner ? 8 : 6;
  const repMax = isolation ? (slot === "CALVES" ? 20 : 20) : 12;
  let targetRir = beginner ? 3 : 2;
  if (experienced && isolation && goal !== "FAT_LOSS") targetRir = 1;
  if (goal === "FAT_LOSS" && experienced) targetRir = 2;
  return { sets, rep_min: repMin, rep_max: repMax, target_rir: targetRir };
}

function exerciseOffset(goal: string, experience: string) {
  if (experience === "BEGINNER") return 0;
  if (goal === "GENERAL_FITNESS") return 1;
  if (experience === "EXPERIENCED") return 1;
  if (goal === "RECOMPOSITION") return 1;
  return 0;
}

function selectExercise(pool: Record<string, ExerciseOption[]>, slot: string, occurrence: number, goal: string, experience: string) {
  const options = pool[slot] ?? pools.FULL_GYM[slot];
  const offset = exerciseOffset(goal, experience);
  const index = (offset + occurrence) % options.length;
  const exercise = options[index];
  const alternative = options.length > 1 ? options[(index + 1) % options.length] : null;
  return { exercise, alternative };
}

function calculateEnergy(b: Baseline, n: NutritionProfile | null, t: TrainingProfile | null, days: number) {
  const weightKg = numeric(b.weight_kg);
  const heightCm = numeric(b.height_cm);
  const ageYears = numeric(b.age_years);
  const bfPct = numeric(b.body_fat_pct);
  const steps = numeric(n?.average_steps);
  const sessionDuration = numeric(t?.session_duration_min);
  const sex = b.sex;

  const missing: string[] = [];
  if (weightKg == null || weightKg <= 0) missing.push("weight");
  const canUseFfm = weightKg != null && bfPct != null && bfPct >= 5 && bfPct <= 60;
  const canUseMifflin = weightKg != null && heightCm != null && ageYears != null && (sex === "MALE" || sex === "FEMALE");
  if (!canUseFfm && !canUseMifflin) missing.push("height + age + sex (or usable body-fat %)");
  if (steps == null || steps < 0) missing.push("average steps");
  if (sessionDuration == null || sessionDuration <= 0) missing.push("session duration");

  if (missing.length > 0 || weightKg == null || steps == null || sessionDuration == null) {
    return {
      maintenance_low: null,
      maintenance_high: null,
      calorie_low: null,
      calorie_high: null,
      estimate_confidence: "LIMITED",
      basis: null,
      missing_inputs: missing,
    };
  }

  let ree = 0;
  let basis = "Mifflin-St Jeor + measurable activity range";
  if (canUseFfm && bfPct != null) {
    const ffm = weightKg * (1 - bfPct / 100);
    ree = 500 + 22 * ffm;
    basis = "Cunningham FFM REE + measurable activity range";
  } else {
    ree = 10 * weightKg + 6.25 * Number(heightCm) - 5 * Number(ageYears) + (sex === "MALE" ? 5 : -161);
  }

  // Broad measurable-activity ranges are intentionally used instead of a subjective activity multiplier.
  const stepLow = steps * weightKg * 0.0003;
  const stepHigh = steps * weightKg * 0.0005;
  const trainingLow = ((3.5 - 1) * 3.5 * weightKg / 200) * sessionDuration * days / 7;
  const trainingHigh = ((6.0 - 1) * 3.5 * weightKg / 200) * sessionDuration * days / 7;
  const cardioMinutes = Math.max(0, numeric(n?.cardio_minutes_per_week) ?? 0);
  const cardioLow = ((4.0 - 1) * 3.5 * weightKg / 200) * cardioMinutes / 7;
  const cardioHigh = ((8.0 - 1) * 3.5 * weightKg / 200) * cardioMinutes / 7;

  const maintenanceLow = round50((ree + stepLow + trainingLow + cardioLow) * 1.08);
  const maintenanceHigh = round50((ree + stepHigh + trainingHigh + cardioHigh) * 1.18);

  let calorieLow = maintenanceLow;
  let calorieHigh = maintenanceHigh;
  if (b.goal === "FAT_LOSS") {
    calorieLow = round50(maintenanceLow * 0.85);
    calorieHigh = round50(maintenanceHigh * 0.90);
  } else if (b.goal === "MUSCLE_GAIN") {
    calorieLow = round50(maintenanceLow * 1.02);
    calorieHigh = round50(maintenanceHigh * 1.08);
  } else if (b.goal === "RECOMPOSITION") {
    calorieLow = round50(maintenanceLow * 0.95);
    calorieHigh = round50(maintenanceHigh * 1.02);
  }

  return {
    maintenance_low: Math.min(maintenanceLow, maintenanceHigh),
    maintenance_high: Math.max(maintenanceLow, maintenanceHigh),
    calorie_low: Math.min(calorieLow, calorieHigh),
    calorie_high: Math.max(calorieLow, calorieHigh),
    estimate_confidence: "MODERATE",
    basis,
    missing_inputs: [],
  };
}

function buildProgram(b: Baseline, n: NutritionProfile | null, t: TrainingProfile | null) {
  const days = clampDays(Number(b.training_days_per_week));
  const familyKey = days === 2 ? "FB2" : days === 3 ? "FB3" : "UL4";
  const baseFamily = familyName(days);
  const family = `${baseFamily} · ${foundationLabel(b.goal)}`;
  const pool = pools[b.equipment_profile] ?? pools.FULL_GYM;
  const activeTemplate = trimTemplate(familyKey, numeric(t?.session_duration_min));
  const targets = volumeTargets(b.goal, b.training_experience);

  const muscleOccurrences = new Map<string, number>();
  activeTemplate.flat().forEach((spec) => muscleOccurrences.set(spec.muscle, (muscleOccurrences.get(spec.muscle) ?? 0) + 1));

  const muscleSeen = new Map<string, number>();
  const slotSeen = new Map<string, number>();
  const trainingItems: TrainingItem[] = activeTemplate.flatMap((slots, dayIndex) =>
    slots.map((spec, order) => {
      const totalOccurrences = muscleOccurrences.get(spec.muscle) ?? 1;
      const seen = muscleSeen.get(spec.muscle) ?? 0;
      const target = targets[spec.muscle] ?? totalOccurrences * 2;
      const base = Math.floor(target / totalOccurrences);
      const remainder = target % totalOccurrences;
      const allocated = Math.min(3, Math.max(2, base + (seen < remainder ? 1 : 0)));
      muscleSeen.set(spec.muscle, seen + 1);

      const slotOccurrence = slotSeen.get(spec.slot) ?? 0;
      const { exercise, alternative } = selectExercise(pool, spec.slot, slotOccurrence, b.goal, b.training_experience);
      slotSeen.set(spec.slot, slotOccurrence + 1);
      const rx = prescription(b.training_experience, spec.slot, b.goal, allocated);

      return {
        training_day: dayIndex + 1,
        movement_slot: spec.slot,
        exercise_key: exercise.key,
        ...rx,
        display_order: order + 1,
        metadata: {
          display_name: exercise.name,
          focus_label: exercise.focus,
          primary_muscle: spec.muscle,
          alternative_key: alternative?.key ?? null,
          alternative_name: alternative?.name ?? null,
          engine_version: ENGINE_VERSION,
        },
      };
    }),
  );

  const weeklyVolume = trainingItems.reduce<Record<string, number>>((acc, item) => {
    const muscle = String(item.metadata.primary_muscle ?? "OTHER");
    acc[muscle] = (acc[muscle] ?? 0) + item.sets;
    return acc;
  }, {});

  const weightKg = Number(b.weight_kg);
  const proteinLowG = Math.round(weightKg * 1.6);
  const proteinHighG = Math.round(weightKg * 2.0);
  const energy = calculateEnergy(b, n, t, days);

  const nutritionTarget = {
    maintenance_low: energy.maintenance_low,
    maintenance_high: energy.maintenance_high,
    calorie_low: energy.calorie_low,
    calorie_high: energy.calorie_high,
    protein_low_g: proteinLowG,
    protein_high_g: proteinHighG,
    fat_min_g: null,
    carb_target_g: null,
    estimate_confidence: energy.estimate_confidence,
  };

  const rationale = [
    `${days} training days → ${baseFamily} standardized family`,
    `${goalName(b.goal)} → starting weekly volume and exercise emphasis adjusted without randomization`,
    `${b.training_experience || "INTERMEDIATE"} → sets, rep ranges and RIR matched to training experience`,
    `${b.equipment_profile || "FULL_GYM"} → exercises selected from the matching equipment pool with visible alternatives`,
  ];
  const duration = numeric(t?.session_duration_min);
  if (duration != null) rationale.push(`${duration} min/session → session density constrained to fit the available training time`);

  const goalSnapshot = {
    goal: b.goal,
    weight_kg: weightKg,
    height_cm: b.height_cm == null ? null : Number(b.height_cm),
    age_years: b.age_years,
    sex: b.sex,
    training_experience: b.training_experience,
    training_days_per_week: days,
    equipment_profile: b.equipment_profile,
    body_fat_pct: b.body_fat_pct == null ? null : Number(b.body_fat_pct),
    body_fat_method: b.body_fat_method,
    average_steps: n?.average_steps ?? null,
    cardio_minutes_per_week: n?.cardio_minutes_per_week ?? null,
    cardio_type: n?.cardio_type ?? null,
    meal_frequency: n?.meal_frequency ?? null,
    current_calories: n?.current_calories == null ? null : Number(n.current_calories),
    session_duration_min: t?.session_duration_min ?? null,
    engine_version: ENGINE_VERSION,
    program_family: family,
    program_rationale: rationale,
    weekly_volume: weeklyVolume,
    energy_estimate: {
      confidence: energy.estimate_confidence,
      basis: energy.basis,
      missing_inputs: energy.missing_inputs,
    },
  };

  return {
    engine_version: ENGINE_VERSION,
    family,
    days,
    training_items: trainingItems,
    weekly_volume: weeklyVolume,
    program_rationale: rationale,
    energy_estimate: goalSnapshot.energy_estimate,
    nutrition_target: nutritionTarget,
    goal_snapshot: goalSnapshot,
    guardrails: [
      "Starting prescription, not individual optimal volume",
      "Variation is deterministic and tied to goal, experience, equipment and available session time",
      "Weekly hard-set volume is kept in conservative starting bands and should be adjusted from observed response",
      "Calories are shown only when measurable inputs support an initial range; real-world trend later has higher authority",
    ],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = getKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = getKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!url || !publishableKey || !secretKey || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "AUTH_CONFIGURATION_ERROR" }, { status: 401, headers: corsHeaders });
  }

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ error: "UNAUTHENTICATED" }, { status: 401, headers: corsHeaders });
  }

  let body: { mode?: string } = {};
  try { body = await req.json(); } catch { /* empty body defaults to preview */ }
  const mode = body.mode === "activate" ? "activate" : "preview";

  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [
    { data: access, error: accessError },
    { data: baseline, error: baselineError },
    { data: nutrition, error: nutritionError },
    { data: trainingProfile, error: trainingProfileError },
  ] = await Promise.all([
    admin.from("user_access").select("tier").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("user_baseline").select("*").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("nutrition_profiles").select("*").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("training_profiles").select("session_duration_min").eq("user_id", userData.user.id).maybeSingle(),
  ]);

  if (accessError || baselineError || nutritionError || trainingProfileError) {
    return Response.json({ error: "FOUNDATION_READ_FAILED" }, { status: 500, headers: corsHeaders });
  }
  if (!access) return Response.json({ error: "USER_ACCESS_NOT_FOUND" }, { status: 409, headers: corsHeaders });
  if (access.tier !== "FREE") return Response.json({ error: "FREE_GENERATOR_REQUIRES_FREE_USER" }, { status: 409, headers: corsHeaders });
  if (!baseline) return Response.json({ error: "BASELINE_REQUIRED" }, { status: 409, headers: corsHeaders });

  const program = buildProgram(baseline as Baseline, nutrition as NutritionProfile | null, trainingProfile as TrainingProfile | null);
  if (mode === "preview") {
    return Response.json({ mode, ...program }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: programId, error: persistError } = await admin.rpc("persist_free_program_version", {
    p_user_id: userData.user.id,
    p_goal_snapshot: program.goal_snapshot,
    p_training_items: program.training_items,
    p_nutrition_target: program.nutrition_target,
  });

  if (persistError) {
    return Response.json({ error: "PROGRAM_PERSIST_FAILED", detail: persistError.message }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ mode, program_id: programId, ...program }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
