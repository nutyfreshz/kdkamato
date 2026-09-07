import { AppShell } from "@/components/app-shell";
import { OnboardingForm } from "@/components/onboarding-form";
import { requireUser } from "@/lib/supabase/auth";

export default async function ProgramStartPage() {
  const user = await requireUser();
  return <AppShell>
    <div className="topline">Free Foundation Setup</div>
    <h1>ถามเฉพาะสิ่งที่เปลี่ยน Program จริง</h1>
    <p>Core plan ใช้ Goal, Training Days, Experience และ Equipment. Session Duration ช่วยกำหนดความหนาแน่นของแต่ละวัน ส่วนข้อมูลพลังงานจะค่อยเปิดเมื่อ measurable inputs เพียงพอ.</p>
    {user ? <OnboardingForm userId={user.id} /> : <div className="notice warning">ต้องใส่ Supabase public env เพื่อเปิด live onboarding ใน runtime นี้.</div>}
  </AppShell>;
}
