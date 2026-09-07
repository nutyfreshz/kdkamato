import { AppShell } from "@/components/app-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { requireUser } from "@/lib/supabase/auth";

export default async function ProgramStartPage() {
  const user = await requireUser();
  return <AppShell><div className="topline">Minimum Onboarding</div><h1>ถามเฉพาะสิ่งที่เปลี่ยน Program</h1><p>BF%, steps และรายละเอียดโภชนาการที่ยังไม่รู้ไม่ใช่ blocker. เราจะเก็บเพิ่มเมื่อมี decision ที่ต้องใช้.</p>{user ? <OnboardingForm userId={user.id} /> : <div className="notice warning">ต้องใส่ Supabase public env เพื่อเปิด live onboarding ใน runtime นี้.</div>}</AppShell>;
}
