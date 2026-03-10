"use client";

import { useEffect, useState } from "react";

function scoreColor(s: number) {
  return s >= 71 ? "#10B981" : s >= 51 ? "#14B8A6" : s >= 31 ? "#F59E0B" : "#EF4444";
}

export function AnimatedScoreRing({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const r     = 52;
  const circ  = 2 * Math.PI * r;
  const color = scoreColor(score);
  const offset = circ - (display / 100) * circ;

  useEffect(() => {
    const duration = 1500;
    const start    = Date.now();
    let raf: number;

    function tick() {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <svg width="140" height="140" viewBox="0 0 128 128" className="rotate-[-90deg]">
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="64" y="72"
        textAnchor="middle"
        fill={color}
        fontSize="26"
        fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "64px 64px" }}
      >
        {display}
      </text>
    </svg>
  );
}
