import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import { buildFreeProgram, validateFreeProgram } from "./engine.mjs";

const CONTRACT_VERSION = "FREE_PROGRAM_CONTRACT_V1";
const EXPECTED_ENGINE_VERSION = "FREE_ENGINE_V1.2";

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

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function rawFocus(trainingProfile: Record<string, unknown> | null) {
  const p = trainingProfile?.priority_muscles;
  if (typeof p === "string") return p.toUpperCase();
  if (Array.isArray(p)) return String(p[0] ?? "").toUpperCase();
  if (p && typeof p === "object") {
    const x = p as Record<string, unknown>;
    return String(x.primary ?? x.focus ?? x.primary_focus ?? "").toUpperCase();
  }
  return "";
}

function numeric(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function validateFoundation(
  baseline: Record<string, unknown>,
  nutrition: Record<string, unknown> | null,
  trainingProfile: Record<string, unknown> | null,
) {
  const errors: string[] = [];
  const goals = new Set(["FAT_LOSS", "MUSCLE_GAIN", "RECOMPOSITION", "GENERAL_FITNESS"]);
  const experience = new Set(["BEGINNER", "INTERMEDIATE", "EXPERIENCED"]);
  const equipment = new Set(["FULL_GYM", "LIMITED_GYM", "HOME_BASIC"]);
  const focuses = new Set(["BALANCED", "CHEST", "BACK", "ARMS", "LEGS", "REPOSTURE"]);
  const durations = new Set([45, 60, 75, 90]);

  const weight = numeric(baseline.weight_kg);
  const height = numeric(baseline.height_cm);
  const age = numeric(baseline.age_years);
  const sex = baseline.sex == null ? null : String(baseline.sex);
  const steps = numeric(nutrition?.average_steps);
  const cardio = numeric(nutrition?.cardio_minutes_per_week);

  if (!goals.has(String(baseline.goal))) errors.push("goal");
  if (weight == null || weight < 20 || weight > 400) errors.push("weight_kg");
  if (!experience.has(String(baseline.training_experience))) errors.push("training_experience");
  if (!Number.isInteger(Number(baseline.training_days_per_week)) || Number(baseline.training_days_per_week) < 2 || Number(baseline.training_days_per_week) > 6) errors.push("training_days_per_week");
  if (!equipment.has(String(baseline.equipment_profile))) errors.push("equipment_profile");
  if (!trainingProfile) errors.push("training_profile");
  if (!durations.has(Number(trainingProfile?.session_duration_min))) errors.push("session_duration_min");
  if (!focuses.has(rawFocus(trainingProfile))) errors.push("training_focus");

  if (height != null && (height < 100 || height > 250)) errors.push("height_cm");
  if (age != null && (!Number.isInteger(age) || age < 13 || age > 100)) errors.push("age_years");
  if (sex != null && sex !== "MALE" && sex !== "FEMALE") errors.push("sex");
  if (steps != null && (steps < 0 || steps > 100000)) errors.push("average_steps");
  if (cardio != null && (cardio < 0 || cardio > 3000)) errors.push("cardio_minutes_per_week");

  return errors;
}

async function fingerprintProgram(program: Record<string, unknown>) {
  const payload = JSON.stringify({
    contract_version: CONTRACT_VERSION,
    engine_version: program.engine_version,
    goal_snapshot: program.goal_snapshot,
    training_items: program.training_items,
    nutrition_target: program.nutrition_target,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = getKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = getKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!url || !publishableKey || !secretKey || !authHeader.startsWith("Bearer ")) {
    return json({ error: "AUTH_CONFIGURATION_ERROR" }, 401);
  }

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  let body: { mode?: string; expected_fingerprint?: string } = {};
  try { body = await req.json(); } catch { body = { mode: "preview" }; }
  if (body.mode != null && body.mode !== "preview" && body.mode !== "activate") {
    return json({ error: "INVALID_MODE" }, 400);
  }
  const mode = body.mode === "activate" ? "activate" : "preview";

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [
    { data: access, error: accessError },
    { data: baseline, error: baselineError },
    { data: nutrition, error: nutritionError },
    { data: trainingProfile, error: trainingProfileError },
  ] = await Promise.all([
    admin.from("user_access").select("tier").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("user_baseline").select("*").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("nutrition_profiles").select("*").eq("user_id", userData.user.id).maybeSingle(),
    admin.from("training_profiles").select("session_duration_min,priority_muscles,basic_constraints,exercise_exclusions").eq("user_id", userData.user.id).maybeSingle(),
  ]);

  if (accessError || baselineError || nutritionError || trainingProfileError) return json({ error: "FOUNDATION_READ_FAILED" }, 500);
  if (!access) return json({ error: "USER_ACCESS_NOT_FOUND" }, 409);
  if (access.tier !== "FREE") return json({ error: "FREE_GENERATOR_REQUIRES_FREE_USER" }, 409);
  if (!baseline) return json({ error: "BASELINE_REQUIRED" }, 409);

  const foundationErrors = validateFoundation(
    baseline as Record<string, unknown>,
    nutrition as Record<string, unknown> | null,
    trainingProfile as Record<string, unknown> | null,
  );
  if (foundationErrors.length) return json({ error: "FOUNDATION_INVALID", fields: foundationErrors }, 409);

  let program;
  try {
    program = buildFreeProgram(baseline, nutrition, trainingProfile);
  } catch (error) {
    return json({ error: "PROGRAM_BUILD_FAILED", detail: error instanceof Error ? error.message : "UNKNOWN" }, 500);
  }

  if (program.engine_version !== EXPECTED_ENGINE_VERSION) {
    return json({ error: "ENGINE_VERSION_MISMATCH", expected: EXPECTED_ENGINE_VERSION, received: program.engine_version ?? null }, 500);
  }

  const validation = validateFreeProgram(program);
  if (!validation.ok) return json({ error: "PROGRAM_VALIDATION_FAILED", detail: validation.errors }, 500);

  const snapshot = program.goal_snapshot ?? {};
  const contractInconsistent =
    snapshot.goal !== baseline.goal ||
    snapshot.training_experience !== baseline.training_experience ||
    snapshot.equipment_profile !== baseline.equipment_profile ||
    snapshot.primary_focus !== program.focus ||
    Number(snapshot.training_days_per_week) !== Number(program.days) ||
    Number(snapshot.session_duration_min) !== Number(program.session_duration_min) ||
    snapshot.program_family !== program.family ||
    JSON.stringify(snapshot.weekly_volume ?? {}) !== JSON.stringify(program.weekly_volume ?? {});

  if (contractInconsistent) return json({ error: "PROGRAM_CONTRACT_INCONSISTENT" }, 500);

  const programFingerprint = await fingerprintProgram(program as Record<string, unknown>);
  const persistedSnapshot = {
    ...program.goal_snapshot,
    contract_version: CONTRACT_VERSION,
    program_fingerprint: programFingerprint,
  };
  const responseProgram = { ...program, goal_snapshot: persistedSnapshot };

  if (mode === "preview") {
    return json({ mode, contract_version: CONTRACT_VERSION, program_fingerprint: programFingerprint, ...responseProgram });
  }

  const expectedFingerprint = String(body.expected_fingerprint ?? "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expectedFingerprint)) return json({ error: "PREVIEW_FINGERPRINT_REQUIRED" }, 409);
  if (expectedFingerprint !== programFingerprint) return json({ error: "PREVIEW_STALE" }, 409);

  const { data: programId, error: persistError } = await admin.rpc("persist_free_program_version", {
    p_user_id: userData.user.id,
    p_goal_snapshot: persistedSnapshot,
    p_training_items: program.training_items,
    p_nutrition_target: program.nutrition_target,
  });

  if (persistError) return json({ error: "PROGRAM_PERSIST_FAILED", detail: persistError.message }, 500);

  return json({ mode, contract_version: CONTRACT_VERSION, program_fingerprint: programFingerprint, program_id: programId, ...responseProgram });
});
