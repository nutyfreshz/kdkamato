"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProcessingOverlay } from "@/components/processing-overlay";

export function LogoutButton({ label = "ออกจากระบบ", redirectTo = "/login" }: { label?: string; redirectTo?: string }) {
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
      <button className="btn" type="button" disabled={busy} onClick={logout}>{busy ? "กำลังออกจากระบบ..." : label}</button>
      {busy && <ProcessingOverlay title="กำลังออกจากระบบ..." detail="กำลังปิดเซสชันของอุปกรณ์นี้และกลับไปที่หน้าเข้าสู่ระบบ" />}
    </>
  );
}
