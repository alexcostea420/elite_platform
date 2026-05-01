"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LivePerformanceSection } from "./track-record-client";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] as const } },
};

type DotColor = "gray" | "amber" | "red" | "green";

const dotBg: Record<DotColor, string> = {
  gray: "bg-slate-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  green: "bg-accent-emerald",
};

type Entry = {
  date: string;
  title: string;
  context: string;
  cash: number;
  dot: DotColor;
  image: string;
  highlight?: boolean;
};

const entries: Entry[] = [
  { date: "5 Aug 2025", title: "Săptămâna 1, deja 55% cash", context: "Prima săptămână de când am înființat grupul. Deja defensiv.", cash: 55, dot: "gray", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/01-aug05-saptamana1-55pct-usdt.jpg" },
  { date: "23 Aug 2025", title: "Cresc la 72% cash", context: "Am riscat să pierd trenul, dar disciplina bate FOMO-ul.", cash: 72, dot: "amber", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/03-aug21-saptamana3-72pct-usdt.jpg" },
  { date: "25 Aug 2025", title: "92% cash, 'Aveți mare grijă'", context: "Am avertizat comunitatea: topul local e aproape.", cash: 92, dot: "amber", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/04-aug25-92pct-usdt-avertizare.jpg" },
  { date: "6 Sep 2025", title: "'AM VÂNDUT TOT', 93% stablecoins", context: "Am identificat un fake pump. Am ieșit complet din alts.", cash: 93, dot: "red", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/06-sep06-vandut-tot-ena-93pct.jpg" },
  { date: "12 Sep 2025", title: "Reintrare selectivă în alts", context: "CRV, ALGO, DOGE, IOTA. Următorul pivot important pe 21 septembrie.", cash: 0, dot: "gray", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/07-sep12-saptamana6-crv-algo-doge.jpg" },
  { date: "30 Sep 2025", title: "Peste linia de plutire în cele mai volatile momente", context: "De la $11,800 la $10,000 și înapoi la $11,200. Fix înainte de crash.", cash: 0, dot: "gray", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/08-sep30-oct06-portofoliu-10k.jpg" },
  { date: "10 Oct 2025", title: "'E BEARMARKET. Am vândut tot.'", context: "Eram pe grafic live. BTC a picat $5,000 în 2 minute. Alts încă nu replicaseră mișcarea. Am ieșit la -10% în loc de -60%.", cash: 70, dot: "red", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/09-oct10-crash-vandut-tot.jpg", highlight: true },
  { date: "11 Oct 2025", title: "'Cine a dormit nu poate să înțeleagă'", context: "BTC -13%, alts până la -73%. Eram deja în USDC.", cash: 68, dot: "red", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/10-oct11-aftermath-minus60.jpg" },
  { date: "12 Oct 2025", title: "100% USDC, 'Dead cat bounce'", context: "Am lichidat tot. Aștept să văd ce se întâmplă.", cash: 100, dot: "green", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/12-oct12-dead-cat-bounce-99pct.jpg" },
  { date: "30 Oct 2025", title: "100% cash, 'Nu dăm comeback'", context: "Nu îmi place ce văd pe structura 4hr și daily. Bear flag confirmat.", cash: 100, dot: "red", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/14-oct30-100pct-usdc-bearflag.jpg" },
  { date: "14 Dec 2025", title: "100% USDC", context: "BOJ meeting bearish. Am ieșit complet din nou.", cash: 100, dot: "gray", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/17-dec11-14-btc56-usdc99.jpg" },
  { date: "25 Jan 2026", title: "Prima poziție după 3 luni", context: "Am intrat 20% XMR. Target $600, stop loss sub $410.", cash: 80, dot: "green", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/18-jan25-79pct-usdc-xmr.jpg" },
  { date: "31 Jan 2026", title: "ETH call: 2250-2350, target 2700-2900", context: "Am planificat entry pe zona de suport. Target pe 14-17 februarie.", cash: 80, dot: "green", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/19-jan31-eth-call-2250.jpg" },
  { date: "2 Feb 2026", title: "40% ETH, execuție conform planului", context: "Am intrat exact în zona anunțată. 59% USDC + 40% ETH.", cash: 60, dot: "green", image: "https://pub-36a9a370a5804b06b1f9c6ab94b83f65.r2.dev/images/track-record/20-feb02-59pct-usdc-40pct-eth.jpg" },
  { date: "Feb, Azi", title: "Povestea continuă...", context: "Restul mișcărilor sunt vizibile doar pentru membrii Elite.", cash: -1, dot: "gray", image: "" },
];

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button className="absolute -top-10 right-0 text-sm text-white/50 hover:text-white" onClick={onClose} type="button">Inchide</button>
        <Image alt="Screenshot Discord" className="w-full rounded-xl border border-white/10" height={800} src={src} width={700} />
        <p className="mt-3 text-center text-xs text-slate-600">Screenshot real din Discord, timestamp imuabil</p>
      </div>
    </div>
  );
}

export default function TrackRecordPage() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#09090B] pb-16 pt-28">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6">

        {/* Hero */}
        <motion.div className="mb-10 text-center" initial="hidden" animate="visible" variants={fadeIn}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#10B981]">Track Record</p>
          <h1 className="text-2xl font-bold text-white sm:text-4xl">
            Am protejat portofoliul când piața a picat -60%.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500">
            Din august 2025 până azi. Fiecare decizie postată public pe Discord înainte să se întâmple.
          </p>
        </motion.div>

        {/* Impact Stats */}
        <motion.div className="glass-card mb-8 grid grid-cols-3 gap-4 px-6 py-6 text-center" initial="hidden" animate="visible" variants={fadeIn}>
          <div>
            <p className="font-mono text-3xl font-bold text-white sm:text-4xl">92%</p>
            <p className="mt-1 text-xs text-slate-500">cash înainte de crash</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-[#10B981] sm:text-4xl">100%</p>
            <p className="mt-1 text-xs text-slate-500">USDC în ziua crash-ului</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-white sm:text-4xl">3 luni</p>
            <p className="mt-1 text-xs text-slate-500">în cash înainte de re-entry</p>
          </div>
        </motion.div>

        {/* Narrative callout */}
        <motion.div
          className="mb-10 rounded-xl border-l-[3px] border-[#10B981] bg-white/[0.02] px-5 py-4 sm:px-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
        >
          <div className="space-y-3 text-sm leading-relaxed text-slate-400">
            <p>Pe 10 octombrie 2025, crypto a suferit cel mai mare crash din ultimii ani.</p>
            <p>Majoritatea traderilor au rămas în monede, ghidați de influenceri și FOMO, nu de propria analiză.</p>
            <p>Grupul nostru a ieșit complet în următoarele 2 zile, la cel mai bun preț posibil, marcând începutul unui bear market care a dus la scăderi de -70%.</p>
            <p>Rezultatul? <span className="text-white font-medium">Membrii au suferit doar -10% drawdown</span>, pentru că am avut curajul să fim contra întregului internet.</p>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div className="relative mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          {/* Vertical line */}
          <div className="absolute left-[11px] top-0 h-full w-[2px] bg-white/[0.06] sm:left-[15px]" />

          <div className="flex flex-col gap-1">
            {entries.map((entry) => {
              const isTeaser = entry.cash === -1;
              return (
              <button
                key={entry.date}
                className={`group relative flex w-full items-start gap-3 rounded-lg px-1 py-2.5 text-left transition-colors sm:items-center sm:gap-4 sm:px-2 sm:py-2 ${
                  entry.highlight ? "bg-red-500/[0.05] border-l-[3px] border-red-500 pl-2 shadow-[inset_0_0_30px_rgba(239,68,68,0.04)]" : ""
                } ${isTeaser ? "border border-dashed border-accent-emerald/20 bg-accent-emerald/[0.03] cursor-default" : "hover:bg-white/[0.03]"}`}
                onClick={() => !isTeaser && entry.image && setLightbox(entry.image)}
                type="button"
              >
                {/* Dot */}
                <div className="relative z-10 mt-1.5 shrink-0 sm:mt-0">
                  <div className={`rounded-full ${dotBg[entry.dot]} ${entry.highlight ? "h-3 w-3 animate-pulse" : "h-2 w-2"}`} />
                </div>

                {/* Date */}
                <span className="w-[72px] shrink-0 font-mono text-[11px] text-slate-600 sm:w-[80px]">{entry.date}</span>

                {/* Title + Context */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-tight ${entry.highlight ? "text-red-400" : "text-white"}`}>{entry.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 truncate sm:overflow-visible sm:whitespace-normal">{entry.context}</p>
                </div>

                {/* Cash Bar */}
                {!isTeaser && (
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-[#10B981] transition-all" style={{ width: `${entry.cash}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] text-slate-600">{entry.cash}%</span>
                  </div>
                )}

                {/* Arrow */}
                <span className="shrink-0 text-xs text-slate-700 transition-colors group-hover:text-[#10B981]">
                  {isTeaser ? "🔒" : "→"}
                </span>
              </button>
              );
            })}
          </div>
        </motion.div>

        {/* Live Bot Performance */}
        <LivePerformanceSection />

        {/* Close */}
        <motion.div className="py-10 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Și acum?</h2>
          <div className="mx-auto mt-4 max-w-md space-y-2 text-sm text-slate-400">
            <p>Portofoliul actual e vizibil doar pentru membrii Elite.</p>
            <p>Fiecare mișcare, în timp real.</p>
            <p>Dacă vrei să vezi cum mă poziționez pentru ce urmează, locul e în grup.</p>
          </div>
          <Link className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#10B981] px-8 py-4 text-base font-bold text-[#09090B] shadow-[0_0_24px_rgba(16,185,129,0.1)] transition-all hover:bg-[#34D399]" href="/signup">
            Începe gratuit · 7 zile →
          </Link>
          <p className="mt-3 text-xs text-slate-600">Acces complet la portofoliul live și toate analizele</p>
        </motion.div>
      </div>

      {/* Lightbox */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </main>
  );
}
