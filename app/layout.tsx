import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "ShowsUp — AI Brand Visibility Scoring",
  description:
    "Find out how visible your brand is across AI-powered search. ShowsUp scores your brand's presence in ChatGPT, Gemini, Claude, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://showsup.co"),
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
      <body className="antialiased bg-[#0A0E17] text-white min-h-screen">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
