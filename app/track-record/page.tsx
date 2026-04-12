"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const } },
};

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <button className="absolute right-4 top-4 text-2xl text-white/60 hover:text-white" onClick={onClose} type="button">x</button>
      <Image alt={alt} className="max-h-[90vh] max-w-full rounded-lg object-contain" height={900} src={src} width={800} />
    </div>
  );
}

function ClickableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`overflow-hidden rounded-lg border border-white/[0.06] transition-all hover:border-white/[0.15] hover:-translate-y-0.5 ${className ?? ""}`} onClick={() => setOpen(true)} type="button">
        <Image alt={alt} className="w-full" height={300} loading="lazy" src={src} width={400} />
      </button>
      {open && <Lightbox alt={alt} onClose={() => setOpen(false)} src={src} />}
    </>
  );
}

export default function TrackRecordPage() {
  return (
    <main className="min-h-screen bg-[#09090B] pb-20 pt-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <motion.div className="mb-16 text-center" initial="hidden" animate="visible" variants={fadeIn}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#10B981]">Track Record</p>
          <h1 className="text-2xl font-bold text-white sm:text-4xl">
            De la protejarea profitului la urmatoarea oportunitate
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
            Toate deciziile de mai jos au fost postate public pe Discord, in timp real, cu timestamp imuabil. Asta nu e o poveste scrisa dupa - e o poveste traita in fata comunitatii.
          </p>
        </motion.div>

        {/* ACT 1 */}
        <motion.section className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <h2 className="text-lg font-bold text-white sm:text-xl">Am simtit ca vine ceva</h2>
          <p className="mb-1 text-xs text-slate-600">August - Septembrie 2025</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Din prima saptamana in care am creat grupul, ceva nu se simtea bine. Chart-urile pe weekly si monthly aratau structura bearish, indicatorii erau in zona de pericol, iar stirile macro nu confirmau continuarea bullish. Asa ca am facut ce fac mereu cand nu sunt sigur: am crescut cash-ul. De la 55% la 72% la 92%. Comunitatea vedea fiecare miscare in timp real.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <ClickableImage src="/track-record/01-aug05-saptamana1-55pct-usdt.jpg" alt="5 Aug 2025 - 55% USDT" />
            <ClickableImage src="/track-record/03-aug21-saptamana3-72pct-usdt.jpg" alt="23 Aug 2025 - 72% USDT" />
            <ClickableImage src="/track-record/04-aug25-92pct-usdt-avertizare.jpg" alt="25 Aug 2025 - 92% USDT" />
          </div>
        </motion.section>

        {/* ACT 2 */}
        <motion.section
          className="mb-16 rounded-xl border-l-[3px] border-red-500 bg-red-500/[0.03] py-8 pl-6 pr-4 sm:py-10 sm:pl-8 sm:pr-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
        >
          <h2 className="text-lg font-bold text-white sm:text-xl">A venit. Si eram pregatit.</h2>
          <p className="mb-1 text-xs text-slate-600">Octombrie 2025</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Pe 10 octombrie piata a picat -60% in 5 minute. Alts -30% pana la -73%. Eu vandusem tot. Nu pentru ca am ghicit - pentru ca am urmarit semnalele si am actionat cand nimeni altcineva nu voia sa vanda. Pe 12 octombrie eram 99.99% USDC in timp ce piata facea &quot;dead cat bounce&quot;. Pe 30 octombrie - 100% cash, cu convingerea ca nu dam comeback in 2-3 zile.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <ClickableImage src="/track-record/09-oct10-crash-vandut-tot.jpg" alt="10 Oct - am vandut tot, e bearmarket" />
            <ClickableImage src="/track-record/10-oct11-aftermath-minus60.jpg" alt="11 Oct - alts -13% la -73%" />
            <ClickableImage src="/track-record/12-oct12-dead-cat-bounce-99pct.jpg" alt="12 Oct - dead cat bounce, 99.99% USDC" />
            <ClickableImage src="/track-record/14-oct30-100pct-usdc-bearflag.jpg" alt="30 Oct - 100% USDC, bear flag" />
          </div>
        </motion.section>

        {/* ACT 3 */}
        <motion.section className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <h2 className="text-lg font-bold text-white sm:text-xl">Acum ma pregatesc pentru ce urmeaza.</h2>
          <p className="mb-1 text-xs text-slate-600">Ianuarie - Februarie 2026</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Dupa 3 luni in cash, am inceput sa reintru. Prima pozitie: XMR cu target clar si stop loss definit. Apoi ETH - vanat la 2250-2350 cu target 2700-2900. Comunitatea a votat cu 12 thumbs up. Executie conform planului.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <ClickableImage src="/track-record/19-jan31-eth-call-2250.jpg" alt="31 Jan - ETH call 2250-2350, 12 thumbs up" />
            <ClickableImage src="/track-record/20-feb02-59pct-usdc-40pct-eth.jpg" alt="2 Feb - 59.56% USDC + 40.4% ETH" />
          </div>
        </motion.section>

        {/* CLOSE */}
        <motion.section className="text-center py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Si acum?</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
            Portofoliul actual e vizibil doar pentru membrii Elite. Fiecare miscare, fiecare decizie, in timp real - exact ca cele de mai sus. Daca vrei sa vezi cum ma pozitionez pentru perioada care urmeaza, locul e in grup.
          </p>
          <Link className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#10B981] px-8 py-4 text-base font-bold text-[#09090B] shadow-[0_0_24px_rgba(16,185,129,0.1)] transition-all hover:bg-[#34D399] hover:shadow-[0_0_40px_rgba(16,185,129,0.18)]" href="/signup">
            Incepe Gratuit - 7 Zile →
          </Link>
          <p className="mt-3 text-xs text-slate-600">Acces complet la portofoliul live si toate analizele</p>
        </motion.section>
      </div>
    </main>
  );
}
