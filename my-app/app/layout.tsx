import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ULPF — Universal Log Pre-processing Framework",
    template: "%s · ULPF",
  },
  description:
    "Enterprise-grade universal log preprocessing, normalization, and intelligence platform. Ingest, parse, normalize, and analyze heterogeneous log sources at scale.",
  keywords: ["log processing", "SIEM", "security", "observability", "log normalization"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#080b0f] text-[#e2e8f0] antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
