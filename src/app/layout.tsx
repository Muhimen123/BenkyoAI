import type { Metadata, Viewport } from "next";
import {
  DM_Serif_Display,
  IBM_Plex_Mono,
  Inter,
  Noto_Sans_Bengali,
} from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
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

// Bangla glyphs aren't in the Latin fonts above, so the UI stack falls through
// to this one. Self-hosted by next/font — no request to Google at runtime.
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
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
    <html
      lang="en"
      className={`${ui.variable} ${display.variable} ${data.variable} ${bengali.variable}`}
    >
      <body className="antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
