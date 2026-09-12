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
    CHEST_FLAT: "อก / ท่าดันแนวนอน",
    HIP_HINGE: "ท่าพับสะโพก",
    QUAD_COMPOUND: "ท่าหลักสำหรับต้นขาด้านหน้า",
  };
  return labels[slot ?? ""] ?? slot ?? "กลุ่มท่าฝึก";
}

function memoryStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    CONFIRMED_GOOD_FIT: "เคยลองแล้ว: เหมาะดี",
    DEPRIORITIZED: "เคยลองแล้ว: ควรลดความสำคัญ",
    TRY: "ควรลองต่อ",
  };
  return labels[status ?? ""] ?? "";
}

export default async function PhysicalConsultPage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลไม่พร้อมใช้งานชั่วคราว</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell>
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><span>ประเมินกับเทรนเนอร์</span></div>
    <div className="topline">Physical Consult</div>
    <h1>เซสชันสำหรับ Trainer</h1>
    <div className="card"><p>เข้าสู่ระบบด้วยบัญชีของผู้ใช้ก่อนเริ่มเซสชัน</p><Link className="btn primary" href="/login?physical=1">เข้าสู่ Physical Consult</Link></div>
  </AppShell>;

  const [{ data: access }, { data: program }] = await Promise.all([
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);
  const isPro = access?.tier === "PRO";

  if (!isPro) return <AppShell>
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><span>ประเมินกับเทรนเนอร์</span></div>
    <div className="topline">Physical Consult</div>
    <h1>Physical Consult สำหรับ PRO</h1>
    <div className="card">
      <p>Physical Consult ใช้ผลการฝึกจริงเป็นส่วนหนึ่งของการปรับ Program บัญชีนี้ยังเป็น FREE จึงยังบันทึกผลการทดลองเข้า Exercise Memory ไม่ได้</p>
      <div className="cta-row"><Link className="btn" href="/lab">ใช้ LAB ต่อ</Link><Link className="btn" href="/home">กลับหน้าแรก</Link></div>
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
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><span>ประเมินกับเทรนเนอร์</span></div>
    <div className="topline">PRO · Physical Consult</div>
    <h1>วัด → ลองจริง → ให้ระบบจำ</h1>
    <p>ข้อมูลที่บันทึกในครั้งนี้จะเชื่อมกับ LAB โปรแกรมฝึก และประวัติการลองท่าของผู้ใช้คนเดิม</p>

    <div className="notice" style={{ marginBottom: 18 }}>
      <strong>จำไว้ในเซสชันนี้</strong>
      <p style={{ marginBottom: 0 }}>LAB ช่วยบอกว่าควรลองอะไร · ผลตอนลองจริงสำคัญกว่า · บันทึกเฉพาะสิ่งที่สังเกตได้</p>
    </div>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 1 · วัดและประเมิน</div>
      <h2>Exercise Fit</h2>
      <p>เลือกท่าที่ต้องการดู หากเคยวัดไว้แล้ว ระบบจะใช้ค่าเดิมให้ทันที</p>
      <div className="cta-row"><Link className="btn primary" href="/lab/exercise-fit?consult=1">เปิด Exercise Fit</Link><Link className="btn" href="/lab/squat-geometry?consult=1">ลองปรับท่า Squat</Link></div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 2 · ลองท่าที่ LAB แนะนำ</div>
      <h2>ลองท่าที่ LAB แนะนำและยังไม่อยู่ใน Program</h2>
      <p>บันทึกได้เฉพาะท่าตัวเลือกปัจจุบันจาก LAB ของผู้ใช้คนนี้ หากท่าอยู่ใน Program ปัจจุบันแล้ว ให้ใช้ขั้นตอนที่ 3 แทน</p>
      {!offProgramGroups.length ? <div className="notice">ขณะนี้ไม่มีท่าจาก LAB ที่อยู่นอก Program ให้ลอง อาจเป็นเพราะยังไม่มีผล Exercise Fit หรือท่าที่เกี่ยวข้องอยู่ใน Program แล้ว</div> : null}
      {offProgramGroups.map((group) => <div key={group.slot ?? "movement"} style={{ marginTop: 18 }}>
        <div className="kicker">{slotLabel(group.slot)}</div>
        {group.candidates.map((candidate, index) => {
          const memoryLabel = memoryStatusLabel(candidate.memory_status);
          return <div className="card" style={{ marginTop: 10 }} key={candidate.exercise_key}>
            <small>{index === 0 ? "ควรลองก่อน" : "ทางเลือกอื่น"}{memoryLabel ? ` · ${memoryLabel}` : ""}</small>
            <PhysicalConsultTrialForm exerciseKey={candidate.exercise_key ?? ""} label={candidate.display_name ?? candidate.exercise_key ?? "ท่าฝึก"} />
          </div>;
        })}
      </div>)}
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 3 · บันทึกผลจาก Program ปัจจุบัน</div>
      <h2>{program ? `Program v${program.program_version}` : "ยังไม่มี Program ปัจจุบัน"}</h2>
      <p>{program ? "เปิดท่าใน Program ปัจจุบันเพื่อบันทึกผลการฝึกจริง ระบบจะนำข้อมูลนี้ไปอัปเดต Exercise Memory" : "สร้าง Program ก่อน หากต้องการบันทึกผลของท่าที่อยู่ใน Program"}</p>
      <div className="cta-row">{program ? <Link className="btn primary" href="/physical-consult/program">บันทึกผลของท่าใน Program</Link> : <Link className="btn" href="/program/start">สร้าง Program</Link>}</div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 4 · จบเซสชัน</div>
      <h2>จบเซสชันบนเครื่อง Trainer</h2>
      <p>การออกจากระบบด้านล่างจะปิดเฉพาะเซสชันของอุปกรณ์นี้ ไม่ได้ออกจากระบบของผู้ใช้บนโทรศัพท์หรืออุปกรณ์อื่น</p>
      <LogoutButton label="จบ Physical Consult และออกจากระบบเครื่องนี้" />
    </section>
  </AppShell>;
}
