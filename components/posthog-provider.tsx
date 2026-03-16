"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  // Capture page views on route changes
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return <>{children}</>;
}
