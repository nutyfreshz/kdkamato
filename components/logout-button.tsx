"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button className="btn" type="button" disabled={busy} onClick={logout}>{busy ? "Signing out..." : "Sign out"}</button>
      {busy && <ProcessingOverlay title="กำลังออกจากระบบ..." detail="กำลังปิด session และกลับไปหน้า Login" />}
    </>
  );
}
