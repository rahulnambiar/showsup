import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShowsUp — Does your brand show up in AI?",
  description:
    "Measure your brand's visibility across ChatGPT, Claude, Gemini and more. Get your free AI visibility score with 1,000 free tokens. Instant results.",
  openGraph: {
    type: "website",
    title: "ShowsUp — AI Brand Visibility Platform",
    description: "Does your brand show up when people ask AI for recommendations? Find out in 60 seconds.",
    url: "https://showsup.co",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
