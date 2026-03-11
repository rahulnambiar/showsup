"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const pendingUrl = localStorage.getItem("pendingUrl");
    const nextPath = pendingUrl
      ? `/app/scan?url=${encodeURIComponent(pendingUrl)}`
      : "/app/dashboard";

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, next: nextPath }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.alreadyConfirmed) {
        setError("This account is already confirmed — please sign in.");
      } else {
        setError(data.error ?? "Signup failed. Please try again.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    setError(null);

    const pendingUrl = localStorage.getItem("pendingUrl");
    const nextPath = pendingUrl
      ? `/app/scan?url=${encodeURIComponent(pendingUrl)}`
      : "/app/dashboard";

    const res = await fetch("/api/auth/resend-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, next: nextPath }),
    });

    const data = await res.json();
    setResending(false);

    if (!res.ok) {
      setResendMessage(data.error ?? "Failed to resend. Please try again.");
    } else {
      setResendMessage("New confirmation email sent!");
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    setOauthLoading(true);

    const supabase = createClient();
    const pendingUrl = localStorage.getItem("pendingUrl");
    const nextPath = pendingUrl
      ? `/app/scan?url=${encodeURIComponent(pendingUrl)}`
      : "/app/dashboard";
    if (pendingUrl) localStorage.removeItem("pendingUrl");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md bg-[#111827] border-white/10 text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Check your email</h2>
          <p className="text-gray-400 text-sm">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            Click it to activate your account.
          </p>
          <p className="text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-3 py-2">
            🎉 You&apos;ll get <strong>1,000 free tokens</strong> — enough to explore the platform!
          </p>

          {resendMessage && (
            <p className={`text-xs px-3 py-2 rounded-lg border ${
              resendMessage.includes("sent")
                ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20"
                : "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20"
            }`}>
              {resendMessage}
            </p>
          )}

          <div className="pt-2 space-y-2">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  Sending…
                </span>
              ) : (
                "Didn't get it? Resend email"
              )}
            </button>
            <div>
              <Link href="/login" className="block text-sm text-[#10B981] hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-[#111827] border-white/10">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span className="text-sm font-medium text-[#10B981]">ShowsUp</span>
        </div>
        <CardTitle className="text-2xl font-bold text-white">Get your AI score</CardTitle>
        <CardDescription className="text-gray-400">
          Create your free account — no credit card required
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/5"
          onClick={handleGoogleSignup}
          disabled={oauthLoading}
        >
          {oauthLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <GoogleIcon />
              Continue with Google
            </span>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#111827] px-2 text-gray-500">or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981] focus:ring-[#10B981]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="bg-[#1F2937] border-white/10 text-white placeholder:text-gray-600 focus:border-[#10B981] focus:ring-[#10B981]"
            />
          </div>

          {error && (
            <p className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] font-semibold"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#0A0E17]/30 border-t-[#0A0E17] rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              "Create free account"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-gray-500 text-center w-full">
          Already have an account?{" "}
          <Link href="/login" className="text-[#10B981] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
