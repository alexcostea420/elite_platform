import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron"
});

export const metadata: Metadata = {
  title: "Armata de Traderi",
  description: "Învață să tranzacționezi ca un profesionist alături de Armata de Traderi."
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
