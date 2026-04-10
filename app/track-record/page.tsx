import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Track Record | Armata de Traderi",
  description:
    "Cum am navigat piața din August 2025 — de la prudență extremă la ieșirea perfectă din crash. Istoric real, nu retrospectiv.",
};

/* ── timeline data ─────────────────────────────────────────────────────── */
type Phase = {
  id: string;
  month: string;
  title: string;
  exposure: number;          // % in market
  mood: "cautious" | "neutral" | "bearish" | "exit" | "accumulate";
  narrative: string;
  quote?: string;
  cards: string[];            // image filenames in /track-record/
  result?: string;
};

const phases: Phase[] = [
  {
    id: "aug-start",
    month: "August 2025",
    title: "Primele semne — reducerea expunerii",
    exposure: 45,
    mood: "cautious",
    narrative:
      "Vara lui 2025. Piața mergea lateral, dar ceva nu se simțea bine. Am început să reduc pozițiile treptat — nu dintr-o dată, ci pas cu pas. Am ajuns la 55% USDT, apoi 70%, apoi 92%. În paralel, am finalizat indicatorul Elite după 3 luni de backtesting. Instinctul spunea 'cash is king', iar datele confirmau.",
    quote: "Am ajuns la 55% USDT. Piața e nesigură, prefer să stau defensiv.",
    cards: ["01_aug_cautious.png", "02_aug_reducing.png"],
  },
  {
    id: "sep-selective",
    month: "Septembrie 2025",
    title: "Intrări selective — sistemul de pivoți",
    exposure: 50,
    mood: "neutral",
    narrative:
      "Septembrie a adus oportunități, dar nu am uitat lecția din vară. Am intrat pe CRV, ALGO și DOGE cu poziții mici, folosind sistemul de pivoți pentru timing. Expunerea a crescut la 50% — un echilibru calculat, nu un pariu. Fiecare intrare avea stop-loss, fiecare ieșire avea target.",
    quote: "50-50 în piață acum. Nu merg all-in, dar nici nu stau pe margine.",
    cards: ["03_sep_selective.png"],
  },
  {
    id: "oct-crash",
    month: "10 Octombrie 2025",
    title: 'CRASH — "Am vândut tot"',
    exposure: 0,
    mood: "exit",
    narrative:
      "Ziua care a confirmat totul. Altcoins au căzut -60% în 5 minute. Dar noi nu am fost prinși. Am vândut tot la primele semne — nu la fund, ci ÎNAINTE de fund. În timp ce alții numărau pierderile, comunitatea era deja în cash. Asta e diferența între un plan și o speranță.",
    quote: "AM VÂNDUT TOT. -60% în 5 minute pe altcoins. E bearmarket. Cash is king.",
    cards: ["04_oct_crash.png"],
    result: "Comunitatea a ieșit ÎNAINTE de crash, nu după.",
  },
  {
    id: "oct-deadcat",
    month: "12 Octombrie 2025",
    title: "Dead Cat Bounce — confirmarea",
    exposure: 0,
    mood: "bearish",
    narrative:
      `2 zile după crash, piața a făcut un bounce. Toată lumea se bucura — "s-a terminat!", "cumpărați!". Dar indicatorii spuneau altceva. Am chemat dead cat bounce când toți cumpărau. Piața a confirmat în zilele următoare — a căzut și mai mult.`,
    quote: "Mi se pare totul fake, fix dead cat bounce. Nu intru. Aștept confirmarea.",
    cards: ["05_oct_dead_cat.png"],
    result: "Dead cat bounce confirmat. Cine a cumpărat a pierdut încă -30%.",
  },
  {
    id: "oct-cash",
    month: "30 Octombrie 2025",
    title: "100% cash — disciplină totală",
    exposure: 0,
    mood: "exit",
    narrative:
      `La sfârșitul lui octombrie, eram 100% USDC. Zero expunere. Într-o lume unde toți "cumpără dip-ul", noi stăteam pe margine cu capitalul intact. Nu e ușor să stai în cash când vezi -50%, -60%, -70% pe ecran. Dar disciplina bate emoția, de fiecare dată.`,
    quote: "Sunt 100% USDC. Am ieșit complet. Piața o să cadă mai mult.",
    cards: ["06_oct_full_cash.png"],
  },
  {
    id: "nov-reentry",
    month: "Noiembrie 2025",
    title: "Reacumulare treptată — nu FOMO",
    exposure: 15,
    mood: "accumulate",
    narrative:
      `Piața s-a stabilizat. Am început să reacumulez cu 5%, apoi 10%, apoi 15%. Pas cu pas, fără FOMO, fără grabă. Fiecare intrare cu plan, cu risc calculat. Asta e trading-ul real — nu "all-in la fund", ci construirea treptată a pozițiilor la zone confirmate.`,
    quote: "Încep să reacumulez încet. 5% alocat. Zone bune pe BTC și ETH.",
    cards: ["07_nov_reaccumulate.png"],
  },
];

const moodConfig = {
  cautious: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", label: "Prudent" },
  neutral: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", label: "Echilibrat" },
  bearish: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", label: "Bearish" },
  exit: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", label: "Full Exit" },
  accumulate: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", label: "Acumulare" },
};

/* ── page ───────────────────────────────────────────────────────────────── */
export default function TrackRecordPage() {
  return (
    <main className="min-h-screen bg-crypto-ink pb-20 pt-28">
      <Container className="max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">
            Track Record
          </p>
          <h1 className="mb-6 text-3xl font-bold text-white sm:text-5xl">
            Cum am navigat
            <br />
            <span className="gradient-text">crash-ul din 2025</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            De la prudență în august, la ieșirea completă înainte de crash, la
            dead cat bounce call-ul perfect. Nu retrospectiv — în timp real, cu
            mesaje din Discord ca dovadă.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-surface-graphite px-5 py-2.5">
            <span className="text-sm text-slate-400">Expunere maximă pierdută în crash:</span>
            <span className="text-lg font-bold text-emerald-400">0%</span>
          </div>
        </div>

        {/* Exposure graph summary */}
        <div className="mb-16 rounded-2xl border border-white/10 bg-surface-graphite p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Expunere în piață — August → Noiembrie 2025
          </h2>
          <div className="flex items-end gap-2 sm:gap-3">
            {phases.map((p) => (
              <div key={p.id} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-white">{p.exposure}%</span>
                <div className="w-full rounded-t-md" style={{
                  height: `${Math.max(p.exposure * 1.5, 8)}px`,
                  backgroundColor: p.exposure === 0
                    ? "rgba(239, 68, 68, 0.6)"
                    : p.exposure <= 20
                      ? "rgba(52, 211, 153, 0.6)"
                      : p.exposure <= 50
                        ? "rgba(96, 165, 250, 0.6)"
                        : "rgba(251, 191, 36, 0.6)",
                }} />
                <span className="text-[10px] text-slate-500 sm:text-xs">{p.month.split(" ")[0].slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500/60" /> Exit
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/60" /> Acumulare
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400/60" /> Echilibrat
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-accent-emerald/50 via-white/10 to-transparent sm:left-8" />

          {phases.map((phase, i) => {
            const mood = moodConfig[phase.mood];
            return (
              <div key={phase.id} className="relative mb-12 pl-16 sm:pl-20">
                {/* Timeline dot */}
                <div className={`absolute left-4 top-1 h-5 w-5 rounded-full border-2 ${mood.border} ${mood.bg} sm:left-6`}>
                  <div className={`absolute inset-1 rounded-full ${mood.bg}`} />
                </div>

                {/* Month label */}
                <div className="mb-3 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${mood.bg} ${mood.color} ${mood.border} border`}>
                    {phase.month}
                  </span>
                  <span className={`text-xs font-semibold ${mood.color}`}>{mood.label}</span>
                  <span className="text-xs text-slate-500">
                    Expunere: {phase.exposure}%
                  </span>
                </div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">
                  {phase.title}
                </h3>

                {/* Narrative */}
                <p className="mb-4 leading-relaxed text-slate-300">
                  {phase.narrative}
                </p>

                {/* Quote */}
                {phase.quote ? (
                  <blockquote className="mb-4 border-l-2 border-accent-emerald/50 pl-4 text-sm italic text-slate-400">
                    &ldquo;{phase.quote}&rdquo;
                    <span className="ml-2 not-italic text-accent-emerald">— AlexArk, Discord</span>
                  </blockquote>
                ) : null}

                {/* Result badge */}
                {phase.result ? (
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400">
                    <span>✓</span> {phase.result}
                  </div>
                ) : null}

                {/* Discord cards */}
                <div className="mt-4 space-y-3">
                  {phase.cards.map((card) => (
                    <div key={card} className="overflow-hidden rounded-lg border border-white/10 shadow-lg">
                      <Image
                        alt={`Discord message - ${phase.title}`}
                        className="w-full"
                        height={120}
                        src={`/track-record/${card}`}
                        width={800}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-accent-emerald/30 bg-surface-graphite p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white">
            Vrei să fii în grup la următorul call?
          </h2>
          <p className="mb-6 text-slate-400">
            Nu știi când vine următorul crash sau rally. Dar poți fi pregătit.
            <br />
            7 zile gratuit, fără card, fără obligații.
          </p>
          <Link
            className="accent-button inline-block px-8 py-4 text-lg font-bold"
            href="/signup"
          >
            Începe Gratuit — 7 Zile →
          </Link>
        </div>
      </Container>
    </main>
  );
}
