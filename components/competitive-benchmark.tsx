import { Card, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CompetitorEntry {
  name: string;
  mention_count: number;
  total_queries: number;
  mention_rate: number;
  avg_position: number | null;
  recommend_count: number;
  sentiment: "positive" | "neutral" | "negative" | null;
}

interface ShareOfVoiceEntry {
  name: string;
  share: number;
  mentions: number;
  isBrand: boolean;
}

export interface CompetitorsData {
  brand_profile: CompetitorEntry;
  competitors: CompetitorEntry[];
  share_of_voice: ShareOfVoiceEntry[];
  insights: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sentimentLabel(s: "positive" | "neutral" | "negative" | null) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sentimentColor(s: "positive" | "neutral" | "negative" | null) {
  if (s === "positive") return "text-[#10B981]";
  if (s === "negative") return "text-[#EF4444]";
  return "text-gray-400";
}

const BAR_COLORS = ["#10B981", "#60A5FA", "#C084FC", "#F59E0B", "#F472B6"];

// ── Component ──────────────────────────────────────────────────────────────────

interface CompetitiveBenchmarkProps {
  data: CompetitorsData;
}

export function CompetitiveBenchmark({ data }: CompetitiveBenchmarkProps) {
  const { brand_profile, competitors = [], share_of_voice = [], insights = [] } = data;

  const hasCompetitors = competitors.length > 0;
  const hasSov = share_of_voice.length > 0;

  if (!hasCompetitors && !hasSov) return null;

  const allEntries = [brand_profile, ...competitors];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-400">Competitive Benchmark</h2>

      {/* Share of Voice */}
      {hasSov && (
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-5 pb-5 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Share of Voice</p>
            <div className="space-y-3">
              {share_of_voice.map((entry, i) => (
                <div key={entry.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${entry.isBrand ? "text-white" : "text-gray-400"}`}>
                      {entry.name}{entry.isBrand && <span className="ml-1.5 text-[10px] text-gray-500">(you)</span>}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>
                      {entry.share}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${entry.share}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Head-to-Head table */}
      {hasCompetitors && (
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-5 pb-4 overflow-x-auto">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Head-to-Head</p>
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Brand</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 px-2">Mention Rate</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 px-2">Avg Position</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 px-2">Recommended</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-2 pl-2">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {allEntries.map((entry, i) => {
                  const isBrand = i === 0;
                  return (
                    <tr key={entry.name} className="border-b border-white/5 last:border-0">
                      <td className={`py-2 pr-4 font-medium ${isBrand ? "text-white" : "text-gray-300"}`}>
                        {entry.name}
                        {isBrand && <span className="ml-1.5 text-[10px] text-gray-600">you</span>}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-300 tabular-nums">{entry.mention_rate}%</td>
                      <td className="py-2 px-2 text-right text-gray-400 tabular-nums">
                        {entry.avg_position !== null ? `#${entry.avg_position}` : "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-400 tabular-nums">{entry.recommend_count}×</td>
                      <td className={`py-2 pl-2 text-right tabular-nums ${sentimentColor(entry.sentiment)}`}>
                        {sentimentLabel(entry.sentiment)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card className="bg-[#111827] border-white/10">
          <CardContent className="pt-5 pb-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Key Insights</p>
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#10B981] text-xs mt-0.5 flex-shrink-0">→</span>
                <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
