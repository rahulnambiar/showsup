"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

interface DataPoint {
  month: string;
  score: number | null;
}

interface Props {
  data: DataPoint[];
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm px-3 py-2 text-[12px]">
      <p className="text-[#6B7280]">{label}</p>
      <p className="font-bold text-[#111827] text-[16px]">{payload[0].value}</p>
    </div>
  );
};

export function ScoreTrend({ data, color = "#10B981" }: Props) {
  const valid = data.filter((d) => d.score !== null);

  if (valid.length === 0) {
    return (
      <div className="flex items-center justify-center h-[140px] text-[13px] text-[#9CA3AF] bg-[#F9FAFB] rounded-xl">
        Historical data appears after multiple monthly scans.
      </div>
    );
  }

  const scores = valid.map((d) => d.score as number);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
        <YAxis domain={[minScore, maxScore]} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={28} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Multi-line for comparison ─────────────────────────────────────────────────

interface MultiLineProps {
  series: Array<{
    name: string;
    data: DataPoint[];
    color: string;
  }>;
  height?: number;
}

export function MultiScoreTrend({ series, height = 220 }: MultiLineProps) {
  const allEmpty = series.every((s) => s.data.filter((d) => d.score !== null).length === 0);

  if (allEmpty) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-[#F9FAFB] text-[13px] text-[#9CA3AF]" style={{ height }}>
        Historical trend lines appear after multiple monthly scans.
      </div>
    );
  }

  // Merge months from all series
  const allMonths = Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.month)))).sort();
  const merged = allMonths.map((month) => {
    const point: Record<string, string | number | null> = { month };
    for (const s of series) {
      const d = s.data.find((x) => x.month === month);
      point[s.name] = d?.score ?? null;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={merged} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={28} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        {series.map((s) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ fill: s.color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
