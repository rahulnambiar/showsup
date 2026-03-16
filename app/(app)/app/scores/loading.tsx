export default function ScoresLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-7 w-36 rounded-lg bg-white/8" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-[#111827] px-5 py-4 flex items-center gap-4">
            <div className="h-5 w-5 rounded-full bg-white/10" />
            <div className="h-4 flex-1 rounded bg-white/6" />
            <div className="h-6 w-14 rounded-lg bg-white/8" />
            <div className="h-8 w-8 rounded-full bg-white/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
