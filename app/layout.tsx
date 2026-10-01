import type { Metadata, Viewport } from "next";
import { Cinzel, Poppins, Yatra_One } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

// Logo fonts: Cinzel for "KALYAN", Yatra One for the Devanagari "श्री कल्याण".
const cinzel = Cinzel({ subsets: ["latin"], weight: ["700", "900"], display: "swap", variable: "--font-cinzel" });
const yatra = Yatra_One({ subsets: ["devanagari", "latin"], weight: "400", display: "swap", variable: "--font-yatra" });

export const metadata: Metadata = {
  title: "Shri Kalyan — Matka • Starline • Gali Desawar",
  description: "Matka markets, Starline and Gali Desawar — play, win and withdraw instantly.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1d4f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${cinzel.variable} ${yatra.variable}`}>
      <body>{children}</body>
    </html>
  );
}
