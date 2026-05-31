import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typoko — Typing Speed Test",
  description:
    "Test and improve your typing speed with quotes, words, and timed challenges.",
  keywords: ["typing test", "wpm", "words per minute", "typing speed", "typoko"],
  openGraph: {
    title: "Typoko — Typing Speed Test",
    description: "Test and improve your typing speed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
