import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";

import { metadataBaseUrl } from "@/lib/seo";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: "Armata de Traderi",
  description: "Învață să tranzacționezi ca un profesionist alături de Armata de Traderi.",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${inter.variable} ${orbitron.variable} font-sans`}>{children}</body>
    </html>
  );
}
