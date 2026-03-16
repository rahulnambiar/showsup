import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your AI Visibility Report — ShowsUp",
  description:
    "Configure a custom AI visibility report. See exactly how your brand appears in ChatGPT, Claude, and Gemini.",
};

export default function ReportBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
