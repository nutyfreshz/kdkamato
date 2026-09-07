import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import { buildFreeProgram } from "./engine.mjs";

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
  try { body = await req.json(); } catch { /* preview default */ }
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

  if (accessError || baselineError || nutritionError || trainingProfileError) {
    return Response.json({ error: "FOUNDATION_READ_FAILED" }, { status: 500, headers: corsHeaders });
  }
  if (!access) return Response.json({ error: "USER_ACCESS_NOT_FOUND" }, { status: 409, headers: corsHeaders });
  if (access.tier !== "FREE") return Response.json({ error: "FREE_GENERATOR_REQUIRES_FREE_USER" }, { status: 409, headers: corsHeaders });
  if (!baseline) return Response.json({ error: "BASELINE_REQUIRED" }, { status: 409, headers: corsHeaders });

  let program;
  try {
    program = buildFreeProgram(baseline, nutrition, trainingProfile);
  } catch (error) {
    return Response.json({ error: "PROGRAM_BUILD_FAILED", detail: error instanceof Error ? error.message : "UNKNOWN" }, { status: 500, headers: corsHeaders });
  }

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
