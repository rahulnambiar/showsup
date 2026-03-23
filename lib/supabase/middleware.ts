import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — must not write any logic between createServerClient and getUser
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Stale/invalid refresh token — clear auth cookies and treat as logged-out
  if (error?.code === "refresh_token_not_found" || error?.status === 400) {
    supabaseResponse.cookies.getAll().forEach(({ name }) => {
      if (name.includes("sb-") && (name.includes("-auth-token") || name.includes("-refresh-token"))) {
        supabaseResponse.cookies.delete(name);
      }
    });
  }

  const { pathname } = request.nextUrl;

  // Protect /app routes — redirect unauthenticated users to /login
  if (!user && pathname.startsWith("/app")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
