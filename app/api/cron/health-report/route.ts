import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

function statusDot(ok: boolean): string {
  return ok ? "🟢" : "🔴";
}

export async function GET(request: Request) {
  // Protect with Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayIso = yesterday.toISOString();

  // ── Gather stats ──────────────────────────────────────────────────────────

  const [
    { count: totalScans },
    { count: scans24h },
    { count: failedScans24h },
    { data: recentScanUsers },
    { data: allUsers },
  ] = await Promise.all([
    admin.from("scans").select("*", { count: "exact", head: true }),
    admin.from("scans").select("*", { count: "exact", head: true }).gte("created_at", yesterdayIso),
    admin.from("scans").select("*", { count: "exact", head: true }).eq("status", "error").gte("created_at", yesterdayIso),
    admin.from("scans").select("user_id").gte("created_at", yesterdayIso),
    admin.auth.admin.listUsers({ perPage: 9999 }),
  ]);

  const uniqueUsers24h = new Set((recentScanUsers ?? []).map((r) => r.user_id)).size;
  const totalUsers = allUsers?.users?.length ?? 0;
  const newUsers24h = (allUsers?.users ?? []).filter(
    (u) => new Date(u.created_at) >= yesterday
  ).length;

  // Recent 5 scans for the log
  const { data: recentScans } = await admin
    .from("scans")
    .select("brand_name, website, overall_score, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const dbOk = totalScans !== null;
  const dateStr = now.toLocaleDateString("en-SG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Singapore",
  });
  const timeStr = now.toLocaleTimeString("en-SG", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore",
  });

  // ── Build HTML email ──────────────────────────────────────────────────────

  const recentScansRows = (recentScans ?? []).map((s) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1F2937;color:#E5E7EB;font-size:13px;">${s.brand_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1F2937;color:#9CA3AF;font-size:13px;">${s.website ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1F2937;font-size:13px;font-weight:700;color:${(s.overall_score ?? 0) >= 51 ? "#10B981" : (s.overall_score ?? 0) >= 31 ? "#F59E0B" : "#EF4444"};">${s.overall_score ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1F2937;color:${s.status === "completed" || s.status === "complete" ? "#10B981" : "#EF4444"};font-size:12px;">${s.status}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0E17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;">

    <!-- Header -->
    <div style="margin-bottom:32px;">
      <p style="color:#10B981;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px 0;">ShowsUp</p>
      <h1 style="color:#F9FAFB;font-size:22px;font-weight:700;margin:0 0 4px 0;">Daily Health Report</h1>
      <p style="color:#6B7280;font-size:13px;margin:0;">${dateStr} &middot; ${timeStr} SGT</p>
    </div>

    <!-- System Status -->
    <div style="background:#111827;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px 0;">System Status</p>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Website</p>
          <p style="color:#E5E7EB;font-size:14px;font-weight:600;margin:0;">${statusDot(true)} Online</p>
        </div>
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Database</p>
          <p style="color:#E5E7EB;font-size:14px;font-weight:600;margin:0;">${statusDot(dbOk)} ${dbOk ? "Connected" : "Error"}</p>
        </div>
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Scan API</p>
          <p style="color:#E5E7EB;font-size:14px;font-weight:600;margin:0;">${statusDot((failedScans24h ?? 0) < 5)} ${(failedScans24h ?? 0) < 5 ? "Healthy" : "Degraded"}</p>
        </div>
      </div>
    </div>

    <!-- Users -->
    <div style="background:#111827;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px 0;">Users</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Total Users</p>
          <p style="color:#10B981;font-size:28px;font-weight:700;font-family:monospace;margin:0;">${formatNumber(totalUsers)}</p>
        </div>
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">New (24h)</p>
          <p style="color:#F9FAFB;font-size:28px;font-weight:700;font-family:monospace;margin:0;">${formatNumber(newUsers24h)}</p>
        </div>
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Active (24h)</p>
          <p style="color:#F9FAFB;font-size:28px;font-weight:700;font-family:monospace;margin:0;">${formatNumber(uniqueUsers24h)}</p>
        </div>
      </div>
    </div>

    <!-- Scans -->
    <div style="background:#111827;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px 0;">Scans</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Total Scans</p>
          <p style="color:#10B981;font-size:28px;font-weight:700;font-family:monospace;margin:0;">${formatNumber(totalScans)}</p>
        </div>
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Last 24h</p>
          <p style="color:#F9FAFB;font-size:28px;font-weight:700;font-family:monospace;margin:0;">${formatNumber(scans24h)}</p>
        </div>
        <div>
          <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;">Failed (24h)</p>
          <p style="color:${(failedScans24h ?? 0) > 0 ? "#EF4444" : "#F9FAFB"};font-size:28px;font-weight:700;font-family:monospace;margin:0;">${formatNumber(failedScans24h)}</p>
        </div>
      </div>
      ${(failedScans24h ?? 0) >= 5 ? `
      <div style="margin-top:16px;padding:12px;background:#1F2937;border-radius:8px;border-left:3px solid #EF4444;">
        <p style="color:#FCA5A5;font-size:13px;font-weight:600;margin:0 0 4px 0;">⚠️ High failure rate detected</p>
        <p style="color:#9CA3AF;font-size:12px;margin:0;">${failedScans24h} failed scans in the last 24h. This may indicate API rate limit issues. Check Vercel logs for details.</p>
      </div>
      ` : ""}
    </div>

    <!-- Recent Scans -->
    ${recentScansRows ? `
    <div style="background:#111827;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#9CA3AF;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px 0;">Recent Scans</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 12px;text-align:left;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1F2937;">Brand</th>
            <th style="padding:8px 12px;text-align:left;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1F2937;">Website</th>
            <th style="padding:8px 12px;text-align:left;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1F2937;">Score</th>
            <th style="padding:8px 12px;text-align:left;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1F2937;">Status</th>
          </tr>
        </thead>
        <tbody>${recentScansRows}</tbody>
      </table>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #1F2937;">
      <p style="color:#4B5563;font-size:12px;margin:0;">ShowsUp automated health report &middot; Sent daily at 6am SGT</p>
      <p style="color:#374151;font-size:11px;margin:8px 0 0 0;">showsup.co</p>
    </div>
  </div>
</body>
</html>`;

  // ── Send via Resend ───────────────────────────────────────────────────────

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "ShowsUp <noreply@showsup.co>",
    to: "rahul@showsup.co",
    subject: `ShowsUp Health Report — ${now.toLocaleDateString("en-SG", { month: "short", day: "numeric", timeZone: "Asia/Singapore" })}`,
    html,
  });

  if (emailError) {
    console.error("[health-report] Failed to send email:", emailError);
    return NextResponse.json({ error: "Email send failed", detail: emailError }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers,
      newUsers24h,
      uniqueUsers24h,
      totalScans,
      scans24h,
      failedScans24h,
    },
  });
}
