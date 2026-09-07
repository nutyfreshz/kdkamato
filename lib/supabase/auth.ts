import { redirect } from "next/navigation";
import { createClient } from "./server";
import { hasSupabaseEnv } from "./config";

export async function requireUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) redirect("/login");
  return { id: sub as string };
}
