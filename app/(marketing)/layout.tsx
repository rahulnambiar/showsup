import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShowsUp — Open Source AEO Agent",
  description:
    "Scan how your brand appears across ChatGPT, Claude, and Gemini. Generate the exact fixes — llms.txt, schema markup, content briefs. MIT licensed, self-host free.",
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
  return (
    <div
      className={`${inter.variable} ${jbMono.variable}`}
      style={{ fontFamily: "var(--font-inter, system-ui, -apple-system, sans-serif)" }}
    >
      {children}
    </div>
  );
}
