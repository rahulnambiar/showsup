import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function getAdmin() {
  return createClient(
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
                    You'll get <strong style="color:#10B981;">1,000 free tokens</strong> to explore the platform.
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

    const anon  = getAnon();
    const admin = getAdmin();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://showsup.co";
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(next ?? "/app/dashboard")}`;

    // Step 1: sign up via anon client — same code path as client-side signup,
    // so it respects Supabase auth settings and works with any allowed email.
    // Supabase may also try to send its own email; we override with Resend below.
    const { error: signUpError } = await anon.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    // Ignore "already registered" — user exists, we just resend the link
    if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    // Step 2: generate a link via admin so Resend can send the branded email.
    // Try magiclink first; fall back to signup type with temp password if disabled.
    let actionLink: string | null = null;

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (!linkError && linkData?.properties?.action_link) {
      actionLink = linkData.properties.action_link;
    } else {
      console.error("[signup] generateLink(magiclink) failed:", linkError?.message);
      // Fall back to Supabase's own resend — user will get Supabase's default email
      await anon.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo } });
      return NextResponse.json({ success: true, fallback: true });
    }

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "ShowsUp <noreply@showsup.co>",
      to: email,
      subject: "Confirm your ShowsUp account",
      html: buildEmail(actionLink),
    });

    if (emailError) {
      console.error("[signup] Resend error:", emailError);
      return NextResponse.json({ error: "Failed to send confirmation email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
