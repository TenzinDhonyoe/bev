import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FridayBanner } from "@/components/FridayBanner";
import { MockBadge } from "@/components/MockBadge";
import "./globals.css";

const sans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const serif = IBM_Plex_Serif({ variable: "--font-display-serif", subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Bev: Thinking, Slow and Slower", template: "%s | Bev" },
  description: "Introducing System Three Models and Bev. Same price as Jev. Same accuracy as Jev (it is Jev). 200x the reasoning experience.",
  openGraph: { title: "Bev: Thinking, Slow and Slower", description: "The slowest classifier in the world, at Jev prices." },
};

export const viewport: Viewport = { themeColor: "#f4ecd8" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
          Skip to content
        </a>
        <FridayBanner />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MockBadge />
      </body>
    </html>
  );
}
