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
    default: "ShowsUp — Get Your Brand to Show Up in AI",
    template: "%s — ShowsUp",
  },
  description:
    "Scan your brand's visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan, implement the fixes, and verify the results.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.showsup.co"),
  openGraph: {
    type: "website",
    siteName: "ShowsUp",
    title: "ShowsUp — Get Your Brand to Show Up in AI",
    description: "Scan your visibility across ChatGPT, Claude, and Gemini. Get a research-backed improvement plan. Implement the fixes. Verify the results.",
    url: "https://www.showsup.co",
  },
  twitter: {
    card: "summary_large_image",
    site: "@showsupco",
    title: "ShowsUp — Get Your Brand to Show Up in AI",
    description: "Is your brand invisible to AI? Scan, diagnose, and fix your visibility across ChatGPT, Claude, and Gemini.",
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
