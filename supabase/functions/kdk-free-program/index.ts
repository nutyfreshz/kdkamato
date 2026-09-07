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

const pools: Record<string, Record<string, { key: string; name: string }>> = {
  FULL_GYM: {
    KNEE_DOMINANT: { key: "HACK_SQUAT", name: "Hack Squat" },
    HIP_HAMSTRING: { key: "SEATED_LEG_CURL", name: "Seated Leg Curl" },
    HORIZONTAL_PRESS: { key: "MACHINE_CHEST_PRESS", name: "Machine Chest Press" },
    VERTICAL_PULL: { key: "LAT_PULLDOWN", name: "Lat Pulldown" },
    HORIZONTAL_PULL: { key: "CHEST_SUPPORTED_ROW", name: "Chest-Supported Row" },
    SHOULDER: { key: "CABLE_LATERAL_RAISE", name: "Cable Lateral Raise" },
    ARMS: { key: "CABLE_CURL_TRICEPS_PRESSDOWN", name: "Cable Curl + Triceps Pressdown" },
  },
  LIMITED_GYM: {
    KNEE_DOMINANT: { key: "LEG_PRESS", name: "Leg Press" },
    HIP_HAMSTRING: { key: "ROMANIAN_DEADLIFT", name: "Romanian Deadlift" },
    HORIZONTAL_PRESS: { key: "DUMBBELL_PRESS", name: "Dumbbell Press" },
    VERTICAL_PULL: { key: "ASSISTED_PULLUP_OR_PULLDOWN", name: "Assisted Pull-up / Pulldown" },
    HORIZONTAL_PULL: { key: "CABLE_ROW", name: "Cable Row" },
    SHOULDER: { key: "DUMBBELL_LATERAL_RAISE", name: "Dumbbell Lateral Raise" },
    ARMS: { key: "DB_CURL_OVERHEAD_EXTENSION", name: "Dumbbell Curl + Overhead Extension" },
  },
  HOME_BASIC: {
    KNEE_DOMINANT: { key: "HEEL_ELEVATED_GOBLET_SQUAT", name: "Heel-Elevated Goblet Squat" },
    HIP_HAMSTRING: { key: "DB_ROMANIAN_DEADLIFT", name: "Dumbbell Romanian Deadlift" },
    HORIZONTAL_PRESS: { key: "DB_FLOOR_PRESS", name: "Dumbbell Floor Press" },
    VERTICAL_PULL: { key: "BAND_OR_ASSISTED_PULLUP", name: "Band / Assisted Pull-up" },
    HORIZONTAL_PULL: { key: "ONE_ARM_DB_ROW", name: "One-Arm Dumbbell Row" },
    SHOULDER: { key: "DUMBBELL_LATERAL_RAISE", name: "Dumbbell Lateral Raise" },
    ARMS: { key: "DB_CURL_TRICEPS_EXTENSION", name: "Dumbbell Curl + Triceps Extension" },
  },
};

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

function clampDays(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(4, Math.max(2, Math.round(value)));
}

function prescription(experience: string, slot: string) {
  const isolation = slot === "SHOULDER" || slot === "ARMS";
  if (experience === "BEGINNER") {
    return { sets: 2, rep_min: isolation ? 10 : 8, rep_max: isolation ? 20 : 12, target_rir: 3 };
  }
  if (experience === "EXPERIENCED") {
    return { sets: isolation ? 2 : 3, rep_min: isolation ? 10 : 6, rep_max: isolation ? 20 : 12, target_rir: isolation ? 1 : 2 };
  }
  return { sets: isolation ? 2 : 3, rep_min: isolation ? 10 : 6, rep_max: isolation ? 20 : 12, target_rir: 2 };
}

function buildProgram(b: Baseline, n: NutritionProfile | null) {
  const days = clampDays(Number(b.training_days_per_week));
  const familyKey = days === 2 ? "FB2" : days === 3 ? "FB3" : "UL4";
  const family = days === 2 ? "Full Body A/B" : days === 3 ? "Full Body A/B/C" : "Upper / Lower 4-Day";
  const pool = pools[b.equipment_profile] ?? pools.FULL_GYM;

  const trainingItems: TrainingItem[] = daySlots[familyKey].flatMap((slots, dayIndex) =>
    slots.map((slot, order) => {
      const exercise = pool[slot];
      const rx = prescription(b.training_experience, slot);
      return {
        training_day: dayIndex + 1,
        movement_slot: slot,
        exercise_key: exercise.key,
        ...rx,
        display_order: order + 1,
        metadata: { display_name: exercise.name },
      };
    }),
  );

  const weightKg = Number(b.weight_kg);
  const proteinLowG = Math.round(weightKg * 1.6);
  const proteinHighG = Math.round(weightKg * 2.0);

  // Product spec intentionally avoids subjective activity multipliers and false precision.
  // Until measurable-input maintenance calibration is locked, calorie/maintenance fields remain null.
  const nutritionTarget = {
    maintenance_low: null,
    maintenance_high: null,
    calorie_low: null,
    calorie_high: null,
    protein_low_g: proteinLowG,
    protein_high_g: proteinHighG,
    fat_min_g: null,
    carb_target_g: null,
    estimate_confidence: "LIMITED",
  };

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
  };

  return {
    family,
    days,
    training_items: trainingItems,
    nutrition_target: nutritionTarget,
    goal_snapshot: goalSnapshot,
    guardrails: [
      "Starting prescription, not individual optimal volume",
      "Exercise selection uses Goal + Equipment + Basic Constraints + Experience",
      "Calories are not guessed from subjective activity multipliers",
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

  const [{ data: access, error: accessError }, { data: baseline, error: baselineError }, { data: nutrition, error: nutritionError }] = await Promise.all([
    admin.from("user_access").select("tier").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("user_baseline").select("*").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("nutrition_profiles").select("*").eq("user_id", userData.user.id).maybeSingle(),
  ]);

  if (accessError || baselineError || nutritionError) {
    return Response.json({ error: "FOUNDATION_READ_FAILED" }, { status: 500, headers: corsHeaders });
  }
  if (!access) return Response.json({ error: "USER_ACCESS_NOT_FOUND" }, { status: 409, headers: corsHeaders });
  if (access.tier !== "FREE") return Response.json({ error: "FREE_GENERATOR_REQUIRES_FREE_USER" }, { status: 409, headers: corsHeaders });
  if (!baseline) return Response.json({ error: "BASELINE_REQUIRED" }, { status: 409, headers: corsHeaders });

  const program = buildProgram(baseline as Baseline, nutrition as NutritionProfile | null);
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
