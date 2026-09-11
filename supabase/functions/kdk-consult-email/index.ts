import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requestCode(id: string) {
  return `PC-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function sendResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY_NOT_CONFIGURED");
  const from = Deno.env.get("KDKAMATO_EMAIL_FROM") || "KDKAMATO Consult <consult@kdkamato.com>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED:${JSON.stringify(payload)}`);
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return Response.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401, headers: corsHeaders });

    const body = await req.json();
    const event = String(body?.event || "");
    const meetingId = String(body?.meetingId || "");
    if (!/^[0-9a-fA-F-]{36}$/.test(meetingId)) return Response.json({ ok: false, error: "VALID_MEETING_ID_REQUIRED" }, { status: 400, headers: corsHeaders });

    const adminEmail = (Deno.env.get("KDKAMATO_PRO_ADMIN_EMAIL") || "brosci.bnbh@gmail.com").toLowerCase();
    const siteUrl = (Deno.env.get("KDKAMATO_SITE_URL") || "https://kdkamato.vercel.app").replace(/\/$/, "");
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: meeting, error: meetingError } = await service
      .from("consult_meetings")
      .select("meeting_id,user_id,status,requested_at,scheduled_at,user_reason,admin_notified_at,user_notified_at")
      .eq("meeting_id", meetingId)
      .single();
    if (meetingError || !meeting) return Response.json({ ok: false, error: "MEETING_NOT_FOUND" }, { status: 404, headers: corsHeaders });

    const code = requestCode(meetingId);

    if (event === "REQUEST_CREATED") {
      if (meeting.user_id !== authData.user.id) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403, headers: corsHeaders });
      if (meeting.admin_notified_at) return Response.json({ ok: true, sent: false, already_notified: true, request_code: code }, { headers: corsHeaders });

      const link = `${siteUrl}/pro-consult?meeting=${encodeURIComponent(meetingId)}`;
      const reason = meeting.user_reason ? esc(meeting.user_reason) : "ไม่ได้ระบุ";
      await sendResend(
        adminEmail,
        `[KDKAMATO PRO] คำขอปรึกษา ${code}`,
        `<h2>มีคำขอ PRO Consult ใหม่</h2><p><strong>Request:</strong> ${code}</p><p><strong>เรื่องที่อยากให้ช่วย:</strong> ${reason}</p><p><a href="${esc(link)}">เปิด PRO Consult</a></p><p>ระบบยังไม่หักสิทธิ์การปรึกษาจนกว่าจะมีการใช้ consult จริง</p>`,
      );
      await service.from("consult_meetings").update({ admin_notified_at: new Date().toISOString() }).eq("meeting_id", meetingId);
      return Response.json({ ok: true, sent: true, request_code: code }, { headers: corsHeaders });
    }

    if (event === "APPOINTMENT_SCHEDULED") {
      if ((authData.user.email || "").toLowerCase() !== adminEmail) return Response.json({ ok: false, error: "PRO_CONSULT_ADMIN_REQUIRED" }, { status: 403, headers: corsHeaders });
      if (!meeting.scheduled_at || meeting.status !== "SCHEDULED") return Response.json({ ok: false, error: "MEETING_NOT_SCHEDULED" }, { status: 400, headers: corsHeaders });
      if (meeting.user_notified_at) return Response.json({ ok: true, sent: false, already_notified: true, request_code: code }, { headers: corsHeaders });

      const { data: userData, error: userError } = await service.auth.admin.getUserById(meeting.user_id);
      const userEmail = userData.user?.email;
      if (userError || !userEmail) return Response.json({ ok: false, error: "USER_EMAIL_NOT_FOUND" }, { status: 400, headers: corsHeaders });

      const when = new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(meeting.scheduled_at));
      await sendResend(
        userEmail,
        `ยืนยันนัด PRO Consult · ${code}`,
        `<h2>ยืนยันนัด PRO Consult</h2><p><strong>Request:</strong> ${code}</p><p><strong>วันและเวลา:</strong> ${esc(when)} (เวลาไทย)</p><p>คำขอของคุณได้รับการรับนัดแล้ว หากต้องการทบทวนรายละเอียด ให้เปิดหน้า PRO Review ใน KDKAMATO</p>`,
      );
      await service.from("consult_meetings").update({ user_notified_at: new Date().toISOString() }).eq("meeting_id", meetingId);
      return Response.json({ ok: true, sent: true, request_code: code }, { headers: corsHeaders });
    }

    return Response.json({ ok: false, error: "INVALID_EVENT" }, { status: 400, headers: corsHeaders });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 500, headers: corsHeaders });
  }
});
