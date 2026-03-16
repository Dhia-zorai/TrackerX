import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import ThemeProvider from "@/components/ThemeProvider";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "TrackerX — Valorant Stats Tracker",
  description: "Track your Valorant competitive performance, match history, agent stats and rank progression.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body className="flex flex-col min-h-screen">
        <QueryProvider>
          <ThemeProvider>
            <div className="flex-1">{children}</div>
            <Footer />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}