import type { Metadata } from "next";
export const metadata: Metadata = { title: "New Scan — ShowsUp" };
export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
