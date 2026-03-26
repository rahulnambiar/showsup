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
  title: { absolute: "ShowsUp — Get Your Brand to Show Up in AI" },
  description:
    "Scan your brand's visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan. Implement the fixes. Verify the results. Free to start.",
  keywords: [
    "AI visibility", "AEO", "answer engine optimisation", "brand visibility AI",
    "ChatGPT visibility", "Claude visibility", "Gemini visibility",
    "llms.txt", "schema markup", "AI search optimisation", "show up in AI",
  ],
  openGraph: {
    type: "website",
    title: { absolute: "ShowsUp — Get Your Brand to Show Up in AI" },
    description: "Scan your visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan. Implement the fixes. Verify the results.",
    url: "https://www.showsup.co",
    siteName: "ShowsUp",
  },
  twitter: {
    card: "summary_large_image",
    title: { absolute: "ShowsUp — Get Your Brand to Show Up in AI" },
    description: "Is your brand invisible to AI? Scan, diagnose, and fix your visibility across ChatGPT, Claude, and Gemini.",
    site: "@showsupco",
  },
  alternates: {
    canonical: "https://www.showsup.co",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.showsup.co/#organization",
      "name": "ShowsUp",
      "url": "https://www.showsup.co",
      "logo": "https://www.showsup.co/logo-120.png",
      "legalName": "FVG Capital Pte. Ltd.",
      "foundingLocation": { "@type": "Place", "name": "Singapore" },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "rahul@firstventuresgroup.com",
        "contactType": "customer support",
      },
      "sameAs": ["https://github.com/rahulnambiar/showsup"],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.showsup.co/#website",
      "url": "https://www.showsup.co",
      "name": "ShowsUp",
      "description": "Scan your brand's visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan.",
      "publisher": { "@id": "https://www.showsup.co/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://www.showsup.co/report-builder?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "name": "ShowsUp",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "url": "https://www.showsup.co",
      "description": "AI brand visibility scanner. Check how ChatGPT, Claude, and Gemini talk about your brand.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free to start",
      },
      "publisher": { "@id": "https://www.showsup.co/#organization" },
    },
  ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
