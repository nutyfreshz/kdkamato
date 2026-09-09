import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { PhysicalConsultTrialForm } from "@/components/physical-consult-trial-form";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type ExerciseRef = { exercise_key?: string; display_name?: string; memory_status?: string; status?: string };
type Suggestion = {
  movement_slot?: string;
  current_exercises?: ExerciseRef[];
  suggested?: ExerciseRef | null;
  alternatives?: ExerciseRef[];
};
type SuggestionPayload = { suggestions?: Suggestion[] };

function slotLabel(slot?: string) {
  const labels: Record<string, string> = {
    CHEST_FLAT: "Chest / Horizontal Press",
    HIP_HINGE: "Hip Hinge",
    QUAD_COMPOUND: "Quad Compound",
  };
  return labels[slot ?? ""] ?? slot ?? "Movement";
}

export default async function PhysicalConsultPage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลยังไม่พร้อม.</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell>
    <div className="topline">Physical Consult</div>
    <h1>Trainer session</h1>
    <div className="card"><p>เข้าสู่ระบบด้วย account ของ user ก่อนเริ่ม session.</p><Link className="btn primary" href="/login?physical=1">Physical Consult Login</Link></div>
  </AppShell>;

  const [{ data: access }, { data: program }] = await Promise.all([
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);
  const isPro = access?.tier === "PRO";

  if (!isPro) return <AppShell>
    <div className="topline">Physical Consult</div>
    <h1>PRO personalization workflow</h1>
    <div className="card">
      <p>Physical Consult ใช้ actual exercise response เป็นส่วนหนึ่งของ PRO personalization. Account นี้ยังเป็น FREE จึงยังบันทึก Physical Consult trial เข้า Exercise Memory ไม่ได้.</p>
      <div className="cta-row"><Link className="btn" href="/lab">ใช้ LAB ต่อ</Link><Link className="btn" href="/home">กลับ Home</Link></div>
    </div>
  </AppShell>;

  const suggestionResult = await supabase.rpc("get_my_pro_exercise_suggestions");
  const payload = (suggestionResult.data ?? {}) as SuggestionPayload;
  const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];

  const offProgramGroups = suggestions.map((s) => {
    const currentKeys = new Set((s.current_exercises ?? []).map((x) => x.exercise_key).filter(Boolean));
    const all = [s.suggested, ...(s.alternatives ?? [])].filter(Boolean) as ExerciseRef[];
    const seen = new Set<string>();
    const candidates = all.filter((x) => {
      const key = x.exercise_key ?? "";
      if (!key || currentKeys.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { slot: s.movement_slot, candidates };
  }).filter((g) => g.candidates.length > 0);

  return <AppShell>
    <div className="topline">PRO · Physical Consult Session</div>
    <h1>วัด → ทดลอง → บันทึกผลจริง</h1>
    <p>Trainer กำลังใช้ session ของ user เดิม ข้อมูลทั้งหมดจึงต่อกับ LAB, Program และ Exercise Memory เดิมโดยไม่สร้าง Trainer account แยก.</p>

    <div className="notice" style={{ marginBottom: 18 }}>
      <strong>Session rule</strong>
      <p style={{ marginBottom: 0 }}>LAB ใช้ตั้งสมมติฐาน · ผลทดลองจริงมี priority สูงกว่า · ไม่ต้องกรอกข้อมูลที่ยังสังเกตไม่ได้.</p>
    </div>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">STEP 1 · MEASURE / SCREEN</div>
      <h2>Exercise Fit</h2>
      <p>เริ่มจาก movement ที่ต้องการประเมิน แล้วใช้ measurement เดิมต่อทันทีถ้าเคยวัดไว้แล้ว.</p>
      <div className="cta-row"><Link className="btn primary" href="/lab/exercise-fit?consult=1">เปิด Exercise Fit</Link><Link className="btn" href="/lab/squat-geometry?consult=1">Squat Setup Trial</Link></div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">STEP 2 · TRY LAB CANDIDATES</div>
      <h2>ทดลอง candidate ที่ยังไม่อยู่ใน Program</h2>
      <p>เฉพาะ candidate ปัจจุบันที่มาจาก LAB ของ user นี้เท่านั้นจึงจะบันทึกได้. ถ้าท่าอยู่ใน Active Program แล้ว ให้ใช้ Step 3 แทน.</p>
      {!offProgramGroups.length ? <div className="notice">ตอนนี้ไม่มี off-program LAB candidate ที่ต้องทดลองเพิ่ม อาจเป็นเพราะยังไม่มี Exercise Fit result หรือ candidate ที่เกี่ยวข้องอยู่ใน Active Program แล้ว.</div> : null}
      {offProgramGroups.map((group) => <div key={group.slot ?? "movement"} style={{ marginTop: 18 }}>
        <div className="kicker">{slotLabel(group.slot)}</div>
        {group.candidates.map((candidate, index) => <div className="card" style={{ marginTop: 10 }} key={candidate.exercise_key}>
          <small>{index === 0 ? "LAB PRIORITY" : "ALTERNATIVE"}{candidate.memory_status ? ` · MEMORY ${candidate.memory_status}` : ""}</small>
          <PhysicalConsultTrialForm exerciseKey={candidate.exercise_key ?? ""} label={candidate.display_name ?? candidate.exercise_key ?? "Exercise"} />
        </div>)}
      </div>)}
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">STEP 3 · ACTIVE PROGRAM RESPONSE</div>
      <h2>{program ? `Program v${program.program_version}` : "ยังไม่มี Active Program"}</h2>
      <p>{program ? "เปิด Program ใน Physical Consult mode เพื่อให้ Exercise Feedback ของท่าที่อยู่ใน Program เปิดพร้อมบันทึก ไม่ต้องไล่หาเมนูเอง." : "สร้าง Active Program ก่อน หากต้องการบันทึก response ของท่าที่อยู่ใน Program."}</p>
      <div className="cta-row">{program ? <Link className="btn primary" href="/program?physical=1">เปิด Program + Feedback</Link> : <Link className="btn" href="/program/start">สร้าง Program</Link>}</div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">STEP 4 · FINISH</div>
      <h2>จบ session บนเครื่อง Trainer</h2>
      <p>Sign out ด้านล่างจะปิดเฉพาะ session ของอุปกรณ์นี้ ไม่ได้ sign out user จากโทรศัพท์หรืออุปกรณ์อื่น.</p>
      <LogoutButton label="จบ Physical Consult และ Sign out เครื่องนี้" />
    </section>
  </AppShell>;
}
