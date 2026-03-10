import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-white/8 px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#10B981]" />
          <span className="text-base font-semibold text-white tracking-tight">ShowsUp</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#10B981]/15 flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-[#10B981]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Blog — Coming Soon</h1>
          <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
            We&apos;re working on AI visibility insights, brand strategy guides, and platform updates.
            Check back soon.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#10B981] hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
