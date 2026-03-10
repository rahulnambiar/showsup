"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-5">
      <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-[#EF4444]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          {error.message && error.message !== "An unknown error occurred"
            ? error.message
            : "An unexpected error occurred. Try refreshing or go back to the dashboard."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="text-sm font-medium text-gray-300 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-4 py-2 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/app/dashboard"
          className="text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0A0E17] rounded-lg px-4 py-2 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
