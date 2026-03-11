import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getAnon() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function buildEmail(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your ShowsUp account</title>
</head>
<body style="margin:0;padding:0;background:#0A0E17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E17;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#10B981;width:8px;height:8px;border-radius:50%;"></td>
                  <td style="padding-left:8px;font-size:16px;font-weight:600;color:#ffffff;">ShowsUp</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:8px;font-size:24px;font-weight:700;color:#ffffff;">
                    Here&apos;s your new confirmation link
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                    You requested a new confirmation link for your ShowsUp account.
                    Click below to confirm your email address.
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <a href="${confirmUrl}"
                       style="display:inline-block;background:#10B981;color:#0A0E17;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;padding:14px 28px;">
                      Confirm email →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#6B7280;line-height:1.6;">
                    If you didn't request this, you can safely ignore it.<br/>
                    This link expires in 24 hours.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:12px;color:#4B5563;">
              © 2026 ShowsUp · <a href="https://showsup.co" style="color:#6B7280;text-decoration:none;">showsup.co</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const { email, next } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const anon  = getAnon();
    const admin = getAdmin();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://showsup.co";
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(next ?? "/app/dashboard")}`;

    // Try admin magic link first (for branded Resend email)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[resend-confirmation] generateLink failed:", linkError?.message);
      // Fall back to Supabase's own resend — triggers their default email
      const { error: resendErr } = await anon.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (resendErr) {
        console.error("[resend-confirmation] auth.resend fallback failed:", resendErr.message);
        return NextResponse.json({ error: "Could not resend — please try signing up again." }, { status: 400 });
      }
      return NextResponse.json({ success: true, fallback: true });
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "ShowsUp <noreply@showsup.co>";

    await resend.emails.send({
      from,
      to: email,
      subject: "Your ShowsUp confirmation link",
      html: buildEmail(linkData.properties.action_link),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resend";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
