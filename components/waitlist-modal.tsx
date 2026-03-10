"use client";

import { useState } from "react";

interface WaitlistModalProps {
  plan: "starter" | "growth";
  onClose: () => void;
}

const CONFIG = {
  starter: {
    title: "Get early access to ShowsUp Starter",
    subtitle: "$29/mo — Monthly audits, all platforms, 100 queries",
  },
  growth: {
    title: "Get early access to ShowsUp Growth",
    subtitle: "$79/mo — Unlimited brands, daily audits, API access",
  },
};

export function WaitlistModal({ plan, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const cfg = CONFIG[plan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg">You&apos;re on the list!</p>
            <p className="text-gray-400 text-sm">
              We&apos;ll notify you when {plan === "starter" ? "Starter" : "Growth"} launches.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">{cfg.title}</h2>
              <p className="text-sm text-gray-400">{cfg.subtitle}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="waitlist-email" className="text-sm text-gray-300 font-medium">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg bg-[#1F2937] border border-white/10 text-white px-4 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-[#0A0E17] font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {submitting ? "Joining…" : "Join Waitlist"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
