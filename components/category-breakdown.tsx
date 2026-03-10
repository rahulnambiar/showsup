const CATEGORY_LABELS: Record<string, string> = {
  awareness:      "Direct Awareness",
  discovery:      "Category Discovery",
  competitive:    "Competitive",
  purchase_intent:"Purchase Intent",
  alternatives:   "Alternatives",
  reputation:     "Reputation & Reviews",
};

const CATEGORY_ORDER = [
  "awareness", "discovery", "competitive",
  "purchase_intent", "alternatives", "reputation",
];

function barColor(score: number) {
  if (score >= 51) return "#10B981";
  if (score >= 31) return "#F59E0B";
  return "#EF4444";
}

function scoreTextColor(score: number) {
  if (score >= 51) return "text-[#10B981]";
  if (score >= 31) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

interface CategoryBreakdownProps {
  scores: Record<string, number>;
}

export function CategoryBreakdown({ scores }: CategoryBreakdownProps) {
  const hasAnyScore = CATEGORY_ORDER.some((cat) => (scores[cat] ?? 0) > 0);
  if (!hasAnyScore) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-400">Visibility Breakdown</h2>
      <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const score = scores[cat] ?? 0;
          return (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{CATEGORY_LABELS[cat]}</span>
                <span className={`text-xs font-semibold tabular-nums ${scoreTextColor(score)}`}>
                  {score}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${score}%`, backgroundColor: barColor(score) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
