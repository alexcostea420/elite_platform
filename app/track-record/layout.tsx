import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Record | Armata de Traderi",
  description: "Fiecare decizie de trading, documentata public pe Discord din August 2025. Zero editare, zero stergere.",
};

export default function TrackRecordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
