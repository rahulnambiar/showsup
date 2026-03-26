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
  title: "ShowsUp — Get Your Brand to Show Up in AI",
  description:
    "Scan your brand's visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan. Implement the fixes. Verify the results. Free to start.",
  keywords: [
    "AI visibility", "AEO", "answer engine optimisation", "brand visibility AI",
    "ChatGPT visibility", "Claude visibility", "Gemini visibility",
    "llms.txt", "schema markup", "AI search optimisation", "show up in AI",
  ],
  openGraph: {
    type: "website",
    title: "ShowsUp — Get Your Brand to Show Up in AI",
    description: "Scan your visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan. Implement the fixes. Verify the results.",
    url: "https://www.showsup.co",
    siteName: "ShowsUp",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp — Get Your Brand to Show Up in AI",
    description: "Is your brand invisible to AI? Scan, diagnose, and fix your visibility across ChatGPT, Claude, and Gemini.",
    site: "@showsupco",
  },
  alternates: {
    canonical: "https://www.showsup.co",
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
