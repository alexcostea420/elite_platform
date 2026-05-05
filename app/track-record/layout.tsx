import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Track Record | Armata de Traderi",
  description: "Fiecare decizie de trading, documentată public pe Discord din August 2025. Zero editare, zero ștergere.",
};

export default function TrackRecordLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar mode="marketing" />
      {children}
      <Footer />
    </>
  );
}
