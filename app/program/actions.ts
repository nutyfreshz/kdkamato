"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function activateFreeProgram() {
  await requireUser();
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) redirect("/login");

  const { data, error } = await supabase.functions.invoke("kdk-free-program", {
    body: { mode: "activate" },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error || !data?.program_id) {
    const message = encodeURIComponent(error?.message ?? data?.error ?? "PROGRAM_ACTIVATION_FAILED");
    redirect(`/program/preview?error=${message}`);
  }

  redirect(`/program?activated=${encodeURIComponent(String(data.program_id))}`);
}
