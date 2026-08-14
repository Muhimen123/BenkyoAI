import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const data = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BenkyoAI — study that remembers what you got wrong",
  description:
    "Turn any topic or your own notes into an adaptive roadmap, practise step by step, and keep the weak points in rotation. Runs on your own AI key.",
};

export const viewport: Viewport = {
  themeColor: "#fdfcfa",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${ui.variable} ${display.variable} ${data.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
