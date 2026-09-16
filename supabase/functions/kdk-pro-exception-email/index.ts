import { createClient } from "npm:@supabase/supabase-js@2";

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortReview(id: string) {
  return `PR-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function sendResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY_NOT_CONFIGURED");
  const from = Deno.env.get("KDKAMATO_EMAIL_FROM") || "KDKAMATO PRO <consult@kdkamato.com>";
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
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = Deno.env.get("KDKAMATO_PRO_ADMIN_EMAIL") || "brosci.bnbh@gmail.com";
  if (!url || !serviceKey) {
    return Response.json({ ok: false, error: "SERVER_CONFIG_INCOMPLETE" }, { status: 500 });
  }

  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: claim, error: claimError } = await service.rpc(
    "bridge_claim_pro_exception_notifications",
    { p_limit: 10 },
  );
  if (claimError) {
    return Response.json({ ok: false, error: claimError.message }, { status: 500 });
  }

  const items = Array.isArray(claim?.items) ? claim.items : [];
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    const reviewId = String(item?.review_id || "");
    const code = shortReview(reviewId);
    try {
      const reasons = Array.isArray(item?.escalation_reasons)
        ? item.escalation_reasons.map((x: unknown) => esc(x)).join(", ")
        : esc(JSON.stringify(item?.escalation_reasons ?? []));
      const displayName = esc(item?.display_name || "ไม่ระบุชื่อ");
      const trigger = esc(item?.trigger_type || "UNKNOWN");
      const priority = esc(item?.priority || "HIGH");

      await sendResend(
        adminEmail,
        `[KDKAMATO PRO][${priority}] Training Exception ${code}`,
        `<h2>KDKAMATO PRO — Exception ต้องตรวจ</h2>` +
          `<p><strong>Case:</strong> ${code}</p>` +
          `<p><strong>User:</strong> ${displayName}</p>` +
          `<p><strong>Priority:</strong> ${priority}</p>` +
          `<p><strong>Trigger:</strong> ${trigger}</p>` +
          `<p><strong>Reason:</strong> ${reasons || "ไม่ระบุ"}</p>` +
          `<p><strong>Review ID:</strong> <code>${esc(reviewId)}</code></p>` +
          `<p>เปิด KDKAMATO PRO review package ด้วย Review ID นี้เพื่อดู evidence ก่อนตัดสินใจ</p>`,
      );

      const { error: markError } = await service.rpc(
        "bridge_mark_pro_exception_notification",
        { p_review_id: reviewId, p_success: true, p_error: null },
      );
      if (markError) throw markError;
      sent += 1;
    } catch (error) {
      failed += 1;
      await service.rpc("bridge_mark_pro_exception_notification", {
        p_review_id: reviewId,
        p_success: false,
        p_error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
    }
  }

  return Response.json({ ok: true, claimed: items.length, sent, failed });
});
