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
    DEPRIORITIZED: "เคยลองแล้ว: ควรพิจารณาท่าอื่นก่อน",
    TRY: "ควรลองต่อ",
  };
  return labels[status ?? ""] ?? "";
}

export default async function PhysicalConsultPage() {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ยังเชื่อมต่อระบบไม่ได้ กรุณาลองใหม่ภายหลัง</div></AppShell>;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return <AppShell>
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><span>ประเมินกับเทรนเนอร์</span></div>
    <div className="topline">Physical Consult</div>
    <h1>การใช้งานบนอุปกรณ์เทรนเนอร์</h1>
    <div className="card"><p>เข้าสู่ระบบด้วยบัญชีของผู้ใช้ก่อนเริ่มเซสชัน</p><Link className="btn primary" href="/login?physical=1">เข้าสู่ระบบสำหรับปรึกษาเทรนเนอร์</Link></div>
  </AppShell>;

  const [{ data: access }, { data: program }] = await Promise.all([
    supabase.from("user_access").select("tier").eq("user_id", userId).maybeSingle(),
    supabase.from("programs").select("program_id,program_version").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ]);
  const isPro = access?.tier === "PRO";

  if (!isPro) return <AppShell>
    <div className="app-breadcrumb"><Link href="/home">หน้าแรก</Link><span>›</span><span>ประเมินกับเทรนเนอร์</span></div>
    <div className="topline">Physical Consult</div>
    <h1>ปรึกษาเทรนเนอร์สำหรับบัญชี PRO</h1>
    <div className="card">
      <p>การปรึกษาเทรนเนอร์ใช้ผลฝึกจริงประกอบการปรับโปรแกรม บัญชีนี้ยังเป็น FREE จึงยังบันทึกผลลองท่าเข้าประวัติรายท่าไม่ได้</p>
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
    <h1>วัด ลองฝึก แล้วบันทึกผล</h1>
    <p>ผลที่บันทึกครั้งนี้จะเชื่อมกับ LAB โปรแกรม และประวัติลองท่าของบัญชีเดิม</p>

    <div className="notice" style={{ marginBottom: 18 }}>
      <strong>ใช้ค่าที่จำไว้ในการใช้งานครั้งนี้</strong>
      <p style={{ marginBottom: 0 }}>ใช้ LAB เลือกสิ่งที่น่าลอง แล้วบันทึกเฉพาะสิ่งที่สังเกตได้จากการฝึกจริง</p>
    </div>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 1 · วัดและประเมิน</div>
      <h2>Exercise Fit</h2>
      <p>เลือกท่าที่ต้องการประเมิน หากเคยวัดแล้ว ระบบจะใช้ค่าเดิมให้</p>
      <div className="cta-row"><Link className="btn primary" href="/lab/exercise-fit?consult=1">เปิดเครื่องมือเลือกท่าฝึก</Link><Link className="btn" href="/lab/squat-geometry?consult=1">ทดลองปรับท่าสควอต</Link></div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 2 · ลองท่าที่ LAB แนะนำ</div>
      <h2>ลองท่าที่ LAB แนะนำและยังไม่อยู่ใน โปรแกรม</h2>
      <p>บันทึกได้เฉพาะท่าตัวเลือกจากผล LAB ปัจจุบันของผู้ฝึกคนนี้ หากท่าอยู่ในโปรแกรมแล้ว ให้บันทึกในขั้นตอนที่ 3</p>
      {!offProgramGroups.length ? <div className="notice">ยังไม่มีท่าจาก LAB ที่อยู่นอกโปรแกรมให้ลอง อาจยังไม่ได้วิเคราะห์ความเหมาะสมของท่า หรือท่าที่แนะนำอยู่ในโปรแกรมแล้ว</div> : null}
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
      <div className="kicker">ขั้นตอนที่ 3 · บันทึกผลจาก โปรแกรมปัจจุบัน</div>
      <h2>{program ? `Program v${program.program_version}` : "ยังไม่มี โปรแกรมปัจจุบัน"}</h2>
      <p>{program ? "เปิดท่าในโปรแกรมปัจจุบันและบันทึกผลฝึก ระบบจะอัปเดตประวัติรายท่าให้" : "สร้างโปรแกรมก่อน เพื่อบันทึกผลของท่าที่อยู่ในโปรแกรม"}</p>
      <div className="cta-row">{program ? <Link className="btn primary" href="/physical-consult/program">บันทึกผลของท่าใน โปรแกรม</Link> : <Link className="btn" href="/program/start">สร้าง โปรแกรม</Link>}</div>
    </section>

    <section className="card" style={{ marginTop: 18 }}>
      <div className="kicker">ขั้นตอนที่ 4 · จบเซสชัน</div>
      <h2>จบการใช้งานบนอุปกรณ์เทรนเนอร์</h2>
      <p>ปุ่มด้านล่างจะออกจากระบบเฉพาะอุปกรณ์นี้ บัญชีบนโทรศัพท์หรืออุปกรณ์อื่นยังใช้งานต่อได้</p>
      <LogoutButton label={"จบการปรึกษาและออกจากระบบเครื่องนี้"} />
    </section>
  </AppShell>;
}
