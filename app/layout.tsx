import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/components/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "ShowsUp — Does your brand show up in AI?",
    template: "%s — ShowsUp",
  },
  description:
    "Measure your brand's visibility across ChatGPT, Claude, Gemini and more. Get your free AI visibility score with 1,000 free tokens. Instant results.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://showsup.co"),
  openGraph: {
    type: "website",
    siteName: "ShowsUp",
    title: "ShowsUp — AI Brand Visibility Platform",
    description: "Does your brand show up when people ask AI for recommendations? Find out in 60 seconds.",
    url: "https://showsup.co",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowsUp — AI Brand Visibility",
    description: "Does your brand show up in ChatGPT, Claude, and Gemini? Find out in 60 seconds.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark font-sans", geistSans.variable, geistMono.variable)}
    >
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <PostHogProvider>
            <TooltipProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </TooltipProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
