import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProConsultScheduleForm } from "@/components/pro-consult-schedule-form";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type ConsultRequest = {
  meeting_id: string;
  request_code: string;
  review_id?: string | null;
  status: string;
  requested_at?: string | null;
  scheduled_at?: string | null;
  user_reason?: string | null;
  entitlement_consumed?: boolean;
  admin_notified_at?: string | null;
  user_notified_at?: string | null;
  display_name?: string | null;
};

type JsonRecord = Record<string, unknown>;

type ConsultCase = {
  meeting?: ConsultRequest;
  user?: {
    user_id?: string;
    email?: string | null;
    display_name?: string | null;
    baseline?: JsonRecord | null;
    training_profile?: JsonRecord | null;
    nutrition_profile?: JsonRecord | null;
  };
  active_program?: {
    program_id?: string;
    program_version?: number;
    program_tier?: string;
    goal_snapshot?: JsonRecord | null;
    nutrition_target?: JsonRecord | null;
    training_items?: JsonRecord[];
  } | null;
  recent_progress?: JsonRecord[];
  recent_lab?: JsonRecord[];
  exercise_memory?: JsonRecord[];
};

const statusLabel: Record<string, string> = {
  REQUESTED: "รอรับคำขอ",
  SCHEDULED: "นัดหมายแล้ว",
  COMPLETED: "เสร็จแล้ว",
  CANCELED: "ยกเลิกแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
};

function formatBangkok(value?: string | null) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function JsonDetails({ title, value }: { title: string; value: unknown }) {
  if (value == null) return null;
  return <details style={{ marginTop: 12 }}>
    <summary style={{ cursor: "pointer", fontWeight: 700 }}>{title}</summary>
    <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12, lineHeight: 1.6 }}>{JSON.stringify(value, null, 2)}</pre>
  </details>;
}

export default async function ProConsultPage({ searchParams }: { searchParams: Promise<{ meeting?: string }> }) {
  if (!hasSupabaseEnv()) return <AppShell><div className="notice warning">ระบบเชื่อมต่อข้อมูลไม่พร้อมใช้งานชั่วคราว</div></AppShell>;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email?.toLowerCase() ?? "";
  const adminEmail = (process.env.KDKAMATO_PRO_ADMIN_EMAIL || "brosci.bnbh@gmail.com").toLowerCase();

  if (!userData.user) return <AppShell><div className="notice warning">กรุณาเข้าสู่ระบบก่อน</div></AppShell>;
  if (email !== adminEmail) return <AppShell><div className="notice warning">บัญชีนี้ไม่มีสิทธิ์เปิด PRO Consult Console</div></AppShell>;

  const params = await searchParams;
  const { data: requestData, error: requestError } = await supabase.rpc("pro_list_consult_requests");
  const requests = (requestData ?? []) as ConsultRequest[];

  let selected: ConsultCase | null = null;
  let caseError = "";
  if (params.meeting) {
    const { data, error } = await supabase.rpc("pro_get_consult_case", { p_meeting_id: params.meeting });
    if (error) caseError = error.message;
    else selected = (data ?? null) as ConsultCase | null;
  }

  return <AppShell>
    <div className="topline">PRO Consult Console</div>
    <h1>คำขอปรึกษา PRO</h1>
    <p>เปิดคำขอเพื่อดูข้อมูล Program, Progress, LAB, Exercise Memory และโภชนาการก่อนรับนัด</p>

    {requestError && <div className="notice warning">โหลดคำขอไม่สำเร็จ: {requestError.message}</div>}

    <div className="grid">
      <div className="card">
        <div className="kicker">รอดำเนินการ</div>
        <div className="metric cyan">{requests.filter((x) => x.status === "REQUESTED").length}</div>
      </div>
      <div className="card">
        <div className="kicker">นัดหมายแล้ว</div>
        <div className="metric">{requests.filter((x) => x.status === "SCHEDULED").length}</div>
      </div>
    </div>

    <section className="card day" style={{ marginTop: 18 }}>
      <div className="kicker">Inbox</div>
      <h2>คำขอล่าสุด</h2>
      {requests.length === 0 ? <p>ยังไม่มีคำขอ</p> : requests.map((r) => <div className="exercise" key={r.meeting_id}>
        <div>
          <strong>{r.request_code}</strong><br />
          <small>{r.display_name || "User"} · {formatBangkok(r.requested_at)}</small><br />
          <small>{r.user_reason || "ไม่ได้ระบุหัวข้อ"}</small>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>{statusLabel[r.status] ?? r.status}</strong><br />
          <Link href={`/pro-consult?meeting=${encodeURIComponent(r.meeting_id)}`}>เปิดเคส →</Link>
        </div>
      </div>)}
    </section>

    {caseError && <div className="notice warning" style={{ marginTop: 18 }}>{caseError}</div>}

    {selected?.meeting && <>
      <section className="card day" style={{ marginTop: 18 }}>
        <div className="kicker">{selected.meeting.request_code}</div>
        <h2>{statusLabel[selected.meeting.status] ?? selected.meeting.status}</h2>
        <p><strong>คำขอ:</strong> {selected.meeting.user_reason || "ไม่ได้ระบุหัวข้อ"}</p>
        <p><strong>ส่งเมื่อ:</strong> {formatBangkok(selected.meeting.requested_at)}</p>
        {selected.meeting.scheduled_at && <p><strong>นัดหมาย:</strong> {formatBangkok(selected.meeting.scheduled_at)}</p>}
        <p><strong>User:</strong> {selected.user?.display_name || "–"} · {selected.user?.email || "–"}</p>
        <p><strong>สิทธิ์ consult:</strong> {selected.meeting.entitlement_consumed ? "ใช้สิทธิ์แล้ว" : "ยังไม่หักสิทธิ์"}</p>
      </section>

      <section className="card day" style={{ marginTop: 18 }}>
        <div className="kicker">ข้อมูลเตรียม Consult</div>
        <h2>ภาพรวมก่อนคุยกับ User</h2>
        <div className="grid">
          <div className="card"><div className="kicker">Program</div><div className="metric cyan">v{selected.active_program?.program_version ?? "–"}</div><p>{selected.active_program?.program_tier ?? "–"}</p></div>
          <div className="card"><div className="kicker">Progress ล่าสุด</div><div className="metric">{selected.recent_progress?.length ?? 0}</div><p>รายการล่าสุดที่ดึงมา</p></div>
          <div className="card"><div className="kicker">LAB ล่าสุด</div><div className="metric">{selected.recent_lab?.length ?? 0}</div><p>ผลที่บันทึกไว้</p></div>
          <div className="card"><div className="kicker">Exercise Memory</div><div className="metric">{selected.exercise_memory?.length ?? 0}</div><p>ท่าที่มี evidence สะสม</p></div>
        </div>
        <JsonDetails title="Baseline / เป้าหมาย" value={selected.user?.baseline} />
        <JsonDetails title="Training profile" value={selected.user?.training_profile} />
        <JsonDetails title="Nutrition profile" value={selected.user?.nutrition_profile} />
        <JsonDetails title="Program goal snapshot" value={selected.active_program?.goal_snapshot} />
        <JsonDetails title="Nutrition target" value={selected.active_program?.nutrition_target} />
        <JsonDetails title="Training items" value={selected.active_program?.training_items} />
        <JsonDetails title="Progress ล่าสุด" value={selected.recent_progress} />
        <JsonDetails title="LAB ล่าสุด" value={selected.recent_lab} />
        <JsonDetails title="Exercise Memory" value={selected.exercise_memory} />
      </section>

      {(selected.meeting.status === "REQUESTED" || selected.meeting.status === "SCHEDULED") && <ProConsultScheduleForm meetingId={selected.meeting.meeting_id} />}
    </>}
  </AppShell>;
}
