import type { Metadata, Viewport } from "next";
import { Cinzel, Poppins, Yatra_One } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

const cinzel = Cinzel({ subsets: ["latin"], weight: "700", display: "swap", variable: "--font-cinzel" });
const yatra = Yatra_One({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-yatra" });

export const metadata: Metadata = {
  title: "Shri Kalyan — Matka • Starline • Gali Desawar",
  description: "Matka markets, Starline and Gali Desawar — play, win and withdraw instantly.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
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
