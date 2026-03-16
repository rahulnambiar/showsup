"use client";

import React from "react";
import Link from "next/link";

interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    try {
      import("@/lib/posthog").then(({ posthog }) =>
        posthog.capture("app_error", {
          error: error.message,
          page: typeof window !== "undefined" ? window.location.pathname : "unknown",
        })
      );
    } catch { /* ignore */ }
    console.error("App error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#EF4444]/15 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
              <p className="text-sm text-gray-400">
                An unexpected error occurred. Your data is safe — try refreshing or return to the dashboard.
              </p>
              {this.state.message && (
                <p className="text-xs text-gray-600 font-mono bg-[#111827] rounded px-3 py-2 text-left break-all">
                  {this.state.message}
                </p>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                className="text-sm font-semibold text-white border border-white/15 rounded-lg px-4 py-2 hover:bg-white/5 transition-colors"
              >
                Refresh
              </button>
              <Link
                href="/app/dashboard"
                className="text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-4 py-2 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
