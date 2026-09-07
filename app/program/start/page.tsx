import { AppShell } from "@/components/app-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { requireUser } from "@/lib/supabase/auth";

export default async function ProgramStartPage() {
  const user = await requireUser();
  return <AppShell>
    <div className="topline">Free Bodybuilding Program</div>
    <h1>เลือก Focus แล้วให้ระบบจัด Training Budget</h1>
    <p>Chest / Back / Arms / Legs / Balanced / Reposture จะเปลี่ยน weekly sets และ exercise allocation จริง โดยคุมจำนวนวัน เวลาต่อครั้ง ประสบการณ์ และอุปกรณ์ที่มี.</p>
    {user ? <OnboardingForm userId={user.id} /> : <div className="notice warning">ต้องใส่ Supabase public env เพื่อเปิด live onboarding ใน runtime นี้.</div>}
  </AppShell>;
}
