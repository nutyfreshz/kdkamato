"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

export function LogoutButton({ label = "Sign out", redirectTo = "/login" }: { label?: string; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button className="btn" type="button" disabled={busy} onClick={logout}>{busy ? "Signing out..." : label}</button>
      {busy && <ProcessingOverlay title="กำลังออกจากระบบ..." detail="กำลังปิด session ของอุปกรณ์นี้และกลับไปหน้า Login" />}
    </>
  );
}
