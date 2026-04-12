import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Track Record | Armata de Traderi",
  description:
    "Fiecare decizie de trading, documentata public pe Discord din August 2025. Zero editare, zero stergere. Screenshot-uri reale.",
};

/* ── badge variants ───────────────────────────────────────────────────── */
type BadgeColor = "red" | "green" | "amber" | "gray";

const badgeStyles: Record<BadgeColor, string> = {
  red: "bg-red-500/15 text-red-400 border border-red-500/30",
  green: "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30",
  amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  gray: "bg-white/5 text-slate-400 border border-white/10",
};

const dotColors: Record<BadgeColor, string> = {
  red: "bg-red-500",
  green: "bg-accent-emerald",
  amber: "bg-amber-500",
  gray: "bg-slate-500",
};

/* ── timeline data ────────────────────────────────────────────────────── */
type TimelineEntry = {
  id: number;
  date: string;
  label: string;
  badgeColor: BadgeColor;
  title: string;
  text: string;
  image: string;
  highlight?: boolean;
};

const entries: TimelineEntry[] = [
  {
    id: 1,
    date: "5 August 2025",
    label: "START",
    badgeColor: "gray",
    title: "Saptamana 1 - 55% USDT",
    text: "Primul update de portofoliu. Deja defensiv - 55% cash. Strategia: astept confirmari, nu FOMO.",
    image: "01-aug05-saptamana1-55pct-usdt.jpg",
  },
  {
    id: 2,
    date: "21-23 August 2025",
    label: "DEFENSIV",
    badgeColor: "amber",
    title: "Cresc cash-ul la 72%",
    text: "Saptamana 3: 72% USDT. 'Risc sa pierd trenul spectaculos' - dar disciplina > FOMO.",
    image: "03-aug21-saptamana3-72pct-usdt.jpg",
  },
  {
    id: 3,
    date: "25 August 2025",
    label: "AVERTIZARE",
    badgeColor: "red",
    title: "92% USDT - 'Aveti mare grija'",
    text: "Am crescut la 92% cash. Mesaj catre comunitate: 'Au performat ca un rahat monedele si topul local e aproape. Aveti mare grija saptamana asta.'",
    image: "04-aug25-92pct-usdt-avertizare.jpg",
  },
  {
    id: 4,
    date: "4-6 Septembrie 2025",
    label: "EXIT TOTAL",
    badgeColor: "red",
    title: "'AM VANDUT TOT' - 93% USDC",
    text: "7 sept sanse mari de top local. Am vandut tot ENA. 'FAKE PUMP.' Portofoliu: 93% stablecoins.",
    image: "06-sep06-vandut-tot-ena-93pct.jpg",
  },
  {
    id: 5,
    date: "12-13 Septembrie 2025",
    label: "REBALANSARE",
    badgeColor: "gray",
    title: "Saptamana 6 - Intrat in alts",
    text: "Alocare noua: 40% CRV, 28% ALGO, 24% DOGE, 7% IOTA. Pivot important pe 21 septembrie.",
    image: "07-sep12-saptamana6-crv-algo-doge.jpg",
  },
  {
    id: 6,
    date: "30 Septembrie 2025",
    label: "HOLD",
    badgeColor: "gray",
    title: "De la +18% la 0",
    text: "'Nu am schimbat nimic, portofelul este pe 0. Am trecut de la 18% profit care s-a evaporat.' Portofoliu: $10,024.",
    image: "08-sep30-oct06-portofoliu-10k.jpg",
  },
  {
    id: 7,
    date: "10 Octombrie 2025",
    label: "CRASH",
    badgeColor: "red",
    title: "'E BEARMARKET' - Am vandut tot",
    text: "'Am vandut tot acum 10 minute. -60% tot in 5 minute. Nu inteleg ce se intampla. E bearmarket.' Piata a picat -13% BTC, alts -30% pana la -73% in aceeasi zi.",
    image: "09-oct10-crash-vandut-tot.jpg",
    highlight: true,
  },
  {
    id: 8,
    date: "11 Octombrie 2025",
    label: "AFTERMATH",
    badgeColor: "red",
    title: "'Cine a dormit nu poate sa inteleaga'",
    text: "BTC -13.78%, ETH -17.41%, TOTAL3 -30%, IOTA -55%, FIL -66%, ENA -69%, LINK -59%, SOL -18%, AVAX -68%. Alex era deja in USDC.",
    image: "10-oct11-aftermath-minus60.jpg",
  },
  {
    id: 9,
    date: "12 Octombrie 2025",
    label: "CONFIRMARE",
    badgeColor: "green",
    title: "'Dead cat bounce' - 99.99% USDC",
    text: "'Mi se pare totul fake fix in dead cat bounce.' A lichidat tot. 99.99% USDC. Chart-ul confirma analiza.",
    image: "12-oct12-dead-cat-bounce-99pct.jpg",
  },
  {
    id: 10,
    date: "27-28 Octombrie 2025",
    label: "INCA CASH",
    badgeColor: "amber",
    title: "Vandut SOL si BTC",
    text: "'Vand tot solana si o parte din btc.' 'Ma pregatesc sa vand daca inchide in 30 min asa.' Chart cu analiza tehnica.",
    image: "13-oct27-vand-sol-btc.jpg",
  },
  {
    id: 11,
    date: "30 Octombrie 2025",
    label: "100% CASH",
    badgeColor: "red",
    title: "'Sunt 100% USDC'",
    text: "'Nu imi place ce vad a schimbat si structura si pe 4hr si pe daily. Nu cred ca dam comeback in 2-3 zile.' Chart cu bear flag pe BTC.",
    image: "14-oct30-100pct-usdc-bearflag.jpg",
  },
  {
    id: 12,
    date: "9 Decembrie 2025",
    label: "ANALIZE",
    badgeColor: "gray",
    title: "POPCAT -> ENA, analize cu chart-uri",
    text: "Modifica portofoliul. POPCAT downtrend vizibil. ENA spargere de trendline cu mic uptrend pe daily.",
    image: "15-dec09-popcat-ena-charts.jpg",
  },
  {
    id: 13,
    date: "11-14 Decembrie 2025",
    label: "TIMING",
    badgeColor: "amber",
    title: "De la BTC 56% la 99.95% USDC",
    text: "'19 decembrie BOJ meeting, probabil sa mareasca ratele = foarte bearish short term.' A iesit complet.",
    image: "17-dec11-14-btc56-usdc99.jpg",
  },
  {
    id: 14,
    date: "25 Ianuarie 2026",
    label: "RE-ENTRY",
    badgeColor: "green",
    title: "79.9% USDC + 20% XMR",
    text: "Prima pozitie dupa luni in cash. XMR cu target 600$, stoploss sub 410$ weekly close.",
    image: "18-jan25-79pct-usdc-xmr.jpg",
  },
  {
    id: 15,
    date: "31 Ianuarie 2026",
    label: "ETH CALL",
    badgeColor: "green",
    title: "ETH 2250-2350, target 2700-2900",
    text: "'De luni incolo vanam 2250-2350 ETH sa pana pe 14-17 februarie cam 2700-2900$.' 12 thumbs up.",
    image: "19-jan31-eth-call-2250.jpg",
  },
  {
    id: 16,
    date: "2 Februarie 2026",
    label: "EXECUTIE",
    badgeColor: "green",
    title: "59.56% USDC + 40.4% ETH",
    text: "A intrat in ETH conform planului. 13 thumbs up de la comunitate.",
    image: "20-feb02-59pct-usdc-40pct-eth.jpg",
  },
];

/* ── page ──────────────────────────────────────────────────────────────── */
export default function TrackRecordPage() {
  return (
    <main className="min-h-screen bg-crypto-ink pb-20 pt-28">
      <Container className="max-w-5xl">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-20 text-center">
          <p className="section-label mb-4">Dovada reala</p>
          <h1 className="mb-6 text-3xl font-bold text-white sm:text-5xl">
            Track Record
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            Fiecare decizie, documentata public pe Discord din August 2025.
            <br />
            Zero editare, zero stergere.
          </p>
        </div>

        {/* ── Timeline ───────────────────────────────────────────────── */}
        <div className="relative">
          {/* Vertical line - left side */}
          <div className="absolute left-3 top-0 h-full w-[2px] bg-white/[0.08] sm:left-4" />

          <div className="flex flex-col gap-12">
            {entries.map((entry, i) => {
              const isOdd = i % 2 === 0; // 0-indexed: first entry is "odd" (index 0)
              const isHighlight = entry.highlight;

              return (
                <div key={entry.id} className="relative pl-10 sm:pl-14">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-1.5 top-1.5 z-10 h-4 w-4 rounded-full border-2 border-crypto-ink sm:left-2.5 ${dotColors[entry.badgeColor]} ${
                      isHighlight ? "animate-pulse" : ""
                    }`}
                  />

                  {/* Card */}
                  <div
                    className={`glass-card overflow-hidden rounded-xl p-0 ${
                      isHighlight
                        ? "border-red-500/20 bg-red-500/[0.02]"
                        : ""
                    }`}
                  >
                    {/* Content grid: alternating image position on desktop */}
                    <div
                      className={`flex flex-col ${
                        isOdd ? "md:flex-row" : "md:flex-row-reverse"
                      }`}
                    >
                      {/* Text side */}
                      <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
                        {/* Date + Label */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            {entry.date}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              badgeStyles[entry.badgeColor]
                            } ${isHighlight ? "animate-pulse" : ""}`}
                          >
                            {entry.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className={`mb-2 text-lg font-bold sm:text-xl ${
                            isHighlight ? "text-red-400" : "text-white"
                          }`}
                        >
                          {entry.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm leading-relaxed text-slate-400">
                          {entry.text}
                        </p>
                      </div>

                      {/* Image side */}
                      <div className="flex-1 p-3 sm:p-4">
                        <Image
                          alt={`Screenshot Discord - ${entry.title}`}
                          className="rounded-lg w-full"
                          height={400}
                          loading="lazy"
                          src={`/track-record/${entry.image}`}
                          width={600}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline end dot */}
          <div className="absolute -bottom-2 left-1.5 h-4 w-4 rounded-full border-2 border-crypto-ink bg-accent-emerald sm:left-2.5" />
        </div>

        {/* ── Bottom section: De ce conteaza ─────────────────────────── */}
        <div className="mt-20 rounded-2xl border border-accent-emerald/20 bg-surface-graphite p-8 text-center sm:p-12">
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            De ce conteaza
          </h2>
          <p className="mx-auto mb-4 max-w-2xl leading-relaxed text-slate-400">
            Oricine poate spune &quot;am stiut&quot; dupa ce s-a intamplat.
            Diferenta e cand ai dovada ca ai actionat INAINTE.
          </p>
          <p className="mx-auto mb-8 max-w-2xl leading-relaxed text-slate-400">
            Fiecare screenshot de mai sus e real, needitat, cu timestamp din
            Discord. Nu e vorba de noroc - e vorba de un sistem de analiza care
            functioneaza. Si poti avea acces la el.
          </p>
          <Link
            className="accent-button inline-block px-8 py-4 text-lg font-bold"
            href="/signup"
          >
            Incepe Gratuit - 7 Zile
          </Link>
        </div>
      </Container>
    </main>
  );
}
