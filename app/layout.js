import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import ThemeProvider from "@/components/ThemeProvider";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://trackerx.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrackerX — Valorant Stats Tracker",
    template: "%s | TrackerX",
  },
  description:
    "Track any Valorant player's stats instantly. View rank, match history, K/D, ACS, headshot %, agent performance and more.",
  keywords: [
    "Valorant stats tracker",
    "Valorant rank tracker",
    "TrackerX",
    "Valorant match history",
    "Valorant ACS",
    "Valorant K/D",
    "Riot ID lookup",
  ],
  authors: [{ name: "Dhia Zorai", url: "https://github.com/Dhia-zorai" }],
  creator: "Dhia Zorai",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "TrackerX",
    title: "TrackerX — Valorant Stats Tracker",
    description:
      "Track any Valorant player's stats instantly. Rank, match history, K/D, ACS, headshot % and agent analytics.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrackerX — Valorant Stats Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackerX — Valorant Stats Tracker",
    description:
      "Track any Valorant player's stats instantly. Rank, match history, K/D, ACS, headshot % and agent analytics.",
    images: ["/og-image.png"],
    creator: "@trackerx",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TrackerX",
  url: SITE_URL,
  description:
    "Free Valorant stats tracker. Search any Riot ID to view rank, match history, K/D, ACS, and full performance analytics.",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: {
    "@type": "Person",
    name: "Dhia Zorai",
    url: "https://github.com/Dhia-zorai",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex flex-col min-h-screen w-full">
        <QueryProvider>
          <ThemeProvider>
            <div className="flex-1 w-full">{children}</div>
            <Footer />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
