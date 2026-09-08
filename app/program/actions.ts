"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

async function edgeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("context" in error)) return null;
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return null;
  try {
    const payload = await context.clone().json() as { error?: string };
    return payload?.error ?? null;
  } catch {
    return null;
  }
}

export async function activateFreeProgram(formData: FormData) {
  await requireUser();
  const expectedFingerprint = String(formData.get("expectedFingerprint") ?? "").trim();
  if (!/^[a-f0-9]{64}$/.test(expectedFingerprint)) {
    redirect("/program/preview?error=PREVIEW_FINGERPRINT_REQUIRED");
  }

  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) redirect("/login");

  const { data, error } = await supabase.functions.invoke("kdk-free-program", {
    body: { mode: "activate", expected_fingerprint: expectedFingerprint },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error || !data?.program_id) {
    const code = await edgeErrorCode(error);
    const message = encodeURIComponent(code ?? data?.error ?? error?.message ?? "PROGRAM_ACTIVATION_FAILED");
    redirect(`/program/preview?error=${message}`);
  }

  redirect(`/program?activated=${encodeURIComponent(String(data.program_id))}`);
}
