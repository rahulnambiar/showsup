import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShowsUp — Open Source AEO Agent",
  description:
    "Scan AI visibility, generate fixes. llms.txt, schema, content briefs. Open source, self-host free.",
  keywords: ["AEO", "AI visibility", "llms.txt", "schema markup", "ChatGPT visibility", "Claude visibility", "brand visibility AI"],
  openGraph: {
    type: "website",
    title: "ShowsUp — Open Source AEO Agent",
    description: "Scan your AI visibility across ChatGPT, Claude & Gemini. Generate llms.txt, schema markup, and content briefs to fix the gaps. MIT licensed, self-host free.",
    url: "https://showsup.co",
    siteName: "ShowsUp",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp — Open Source AEO Agent",
    description: "Does your brand show up in AI? Scan, diagnose, and fix your AI visibility. Open source.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
