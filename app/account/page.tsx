import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function AccountPage(){
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน.</div></AppShell>;

  const [{ data: userData }, { data: access }, { count: programCount }, { count: progressCount }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("user_access").select("tier,pro_active_since").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("progress_entries").select("entry_id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  return <AppShell>
    <div className="topline">Account</div><h1>บัญชีเดียว ประวัติ Program ต่อเนื่อง</h1>
    <div className="grid">
      <div className="card"><div className="kicker">Email</div><div className="metric" style={{fontSize:"1rem"}}>{userData.user?.email ?? "–"}</div></div>
      <div className="card"><div className="kicker">Tier</div><div className="metric cyan">{access?.tier ?? "FREE"}</div></div>
      <div className="card"><div className="kicker">Program Versions</div><div className="metric">{programCount ?? 0}</div></div>
      <div className="card"><div className="kicker">Progress Checks</div><div className="metric">{progressCount ?? 0}</div></div>
    </div>
    <div className="card" style={{marginTop:18}}><p>FREE และ PRO ใช้ account และ history เดียวกัน การเปลี่ยน Tier เป็น server-controlled state และไม่สามารถยกระดับจาก browser เองได้.</p><LogoutButton /></div>
  </AppShell>;
}
