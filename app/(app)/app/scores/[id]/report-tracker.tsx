"use client";

import { useEffect } from "react";
import { trackReportViewed } from "@/lib/analytics";

export function ReportTracker({ scanId, score, brand }: { scanId: string; score: number; brand: string }) {
  useEffect(() => {
    trackReportViewed({ scan_id: scanId, score, brand });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
