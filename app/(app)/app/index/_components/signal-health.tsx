"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from "recharts";
import { scoreHex } from "./score-utils";
import type { BrandRow } from "./score-utils";

interface Props {
  rows: BrandRow[];
}

const SIGNALS = [
  { key: "llm_probing_score",        label: "LLM Probing"        },
  { key: "structured_data_score",    label: "Structured Data"    },
  { key: "training_data_score",      label: "Training Data"      },
  { key: "citation_sources_score",   label: "Citation Sources"   },
  { key: "search_correlation_score", label: "Search Correlation" },
  { key: "crawler_readiness_score",  label: "Crawler Readiness"  },
] as const;

export function SignalHealth({ rows }: Props) {
  const data = SIGNALS.map(({ key, label }) => {
    const values = rows.filter((r) => r[key] !== null).map((r) => r[key] as number);
    const avg = values.length > 0
      ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
      : 0;
    return { label, avg, key };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Signal Health Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Average score per signal layer across all brands</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />60+</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />30-59</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />&lt;30</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No data for this month yet. Run the index scan first.</p>
      ) : (
        <div className="space-y-2">
          {data.map(({ label, avg }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-36 flex-shrink-0 font-medium">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${avg}%`, backgroundColor: scoreHex(avg), minWidth: avg > 0 ? "20px" : "0" }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow">{avg}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-gray-700 w-8 text-right">{avg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recharts mini bar for visual reference */}
      {rows.length > 0 && (
        <div className="mt-6 hidden">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => [`${v}`, "Avg Score"]} />
              <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
                {data.map(({ avg }, i) => (
                  <Cell key={i} fill={scoreHex(avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
