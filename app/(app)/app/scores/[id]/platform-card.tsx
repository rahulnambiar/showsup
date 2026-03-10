"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScanResultRow {
  model: string;
  prompt: string | null;
  response: string | null;
  brand_mentioned: boolean | null;
  mention_count: number | null;
  score: number | null;
}

interface PlatformCardProps {
  modelId: string;
  label: string;
  color: string;
  score: number;
  mentioned: boolean;
  results: ScanResultRow[];
}

function scoreColor(score: number) {
  if (score >= 71) return "text-[#10B981]";
  if (score >= 51) return "text-[#14B8A6]";
  if (score >= 31) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function scoreBorderBg(score: number) {
  if (score >= 71) return "border-[#10B981]/20 bg-[#10B981]/5";
  if (score >= 51) return "border-[#14B8A6]/20 bg-[#14B8A6]/5";
  if (score >= 31) return "border-[#F59E0B]/20 bg-[#F59E0B]/5";
  return "border-[#EF4444]/20 bg-[#EF4444]/5";
}


function getPromptLabel(prompt: string | null): string {
  if (!prompt) return "Query";
  if (prompt.includes("Describe what they do")) return "Direct Awareness";
  if (prompt.includes("top") && prompt.includes("companies")) return "Category Discovery";
  if (prompt.includes("Compare")) return "Competitive Comparison";
  if (prompt.includes("reviews")) return "Reputation & Reviews";
  if (prompt.includes("alternatives")) return "Alternatives";
  if (prompt.includes("small businesses")) return "Use Case";
  if (prompt.includes("best value")) return "Value for Money";
  if (prompt.includes("reliability")) return "Reliability";
  return "Query";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PlatformCard({ modelId: _modelId, label, color, score, mentioned, results }: PlatformCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-[#111827] border-white/10 overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <CardTitle className="text-sm font-semibold text-white">{label}</CardTitle>
              {mentioned ? (
                <Badge className="bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 text-xs">
                  Mentioned
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-700 text-gray-500 text-xs">
                  Not found
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Progress bar */}
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor:
                      score >= 71 ? "#10B981" : score >= 51 ? "#14B8A6" : score >= 31 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
              <span className={`text-xl font-bold ${scoreColor(score)}`}>
                {score}
              </span>
              <span className="text-gray-600 text-sm">{expanded ? "▲" : "▼"}</span>
            </div>
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="border-t border-white/5 pt-4 space-y-5">
          {results.map((r, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {getPromptLabel(r.prompt)}
                </span>
              </div>
              <p className="text-xs text-gray-400 italic">&ldquo;{r.prompt}&rdquo;</p>
              <div
                className={cn(
                  "rounded-lg border p-3 text-sm text-gray-300 leading-relaxed",
                  scoreBorderBg(r.score ?? 0)
                )}
              >
                {r.response || <span className="text-gray-600">No response</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>
                  Score: <span className={scoreColor(r.score ?? 0)}>{r.score ?? 0}/100</span>
                </span>
                {r.brand_mentioned && <span>· Mentioned {r.mention_count}×</span>}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
