export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-white/8" />
        <div className="h-4 w-72 rounded bg-white/5" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-[#111827] p-6 space-y-3">
            <div className="h-3.5 w-24 rounded bg-white/8" />
            <div className="h-10 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-white/8 bg-[#111827] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6">
          <div className="h-4 w-32 rounded bg-white/8" />
        </div>
        <div className="divide-y divide-white/6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="h-4 flex-1 rounded bg-white/6" />
              <div className="h-4 w-16 rounded bg-white/6" />
              <div className="h-4 w-20 rounded bg-white/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
