import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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
                    Confirm your email
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;font-size:15px;color:#9CA3AF;line-height:1.6;">
                    Click below to activate your ShowsUp account.
                    You'll get <strong style="color:#10B981;">50 free tokens</strong> to run your first brand scan.
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
                    If you didn't sign up for ShowsUp, you can safely ignore this email.<br/>
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
    const { email, password, next } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const admin = getAdmin();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://showsup.co";
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(next ?? "/app/dashboard")}`;

    // Step 1: create user via admin API (bypasses signup restrictions)
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    // Ignore "already registered" — we'll just send a fresh link below
    if (createError && !createError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Step 2: generate a magic link (no signup restrictions, no password needed)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: "Failed to generate confirmation link." }, { status: 500 });
    }

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "ShowsUp <noreply@showsup.co>",
      to: email,
      subject: "Confirm your ShowsUp account",
      html: buildEmail(linkData.properties.action_link),
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json({ error: "Failed to send confirmation email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
