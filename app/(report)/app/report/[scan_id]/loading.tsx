export default function ReportLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-16 animate-pulse">
      {/* Score gauge skeleton */}
      <div className="flex flex-col items-center gap-6">
        <div className="w-44 h-44 rounded-full bg-white/8" />
        <div className="space-y-2 text-center">
          <div className="h-8 w-64 rounded-lg bg-white/8 mx-auto" />
          <div className="h-4 w-48 rounded bg-white/5 mx-auto" />
        </div>
        <div className="flex gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 w-36 rounded-xl bg-[#111827] border border-white/8" />
          ))}
        </div>
      </div>

      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-5 w-48 rounded bg-white/8" />
          <div className="rounded-xl border border-white/8 bg-[#111827] p-6 space-y-3">
            <div className="h-3 w-full rounded bg-white/6" />
            <div className="h-3 w-4/5 rounded bg-white/6" />
            <div className="h-3 w-3/5 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
