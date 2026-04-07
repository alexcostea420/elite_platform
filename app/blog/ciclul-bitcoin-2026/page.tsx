import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title:
    "Bitcoin in 2026 - Suntem la Bottom? 7 Indicatori Analizati | Armata de Traderi",
  description:
    "Analiza completa a ciclului Bitcoin in 2026: 7 indicatori independenti care arata ca suntem la sau aproape de bottom. Cycle timing, RSI, Gold/BTC, Fed Rate si altele.",
  keywords: [
    "bitcoin 2026",
    "bitcoin bottom",
    "ciclu bitcoin",
    "analiza bitcoin",
    "bitcoin bear market",
    "crypto romania",
    "bitcoin halving",
  ],
  path: "/blog/ciclul-bitcoin-2026",
  type: "article",
});

export default function CiclulBitcoin2026Page() {
  return (
    <>
      <Navbar mode="marketing" />
      <main className="min-h-screen pt-28 pb-20">
        <Container>
          <article className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/blog" className="hover:text-accent-emerald">
                Blog
              </Link>
              <span>/</span>
              <span className="text-slate-400">Ciclul Bitcoin 2026</span>
            </nav>

            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1 text-xs font-semibold text-accent-emerald">
                Analiză
              </span>
              <span className="text-slate-500">Martie 2026</span>
              <span className="text-slate-500">12 min citire</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
              Bitcoin in 2026 -{" "}
              <span className="gradient-text">Suntem la Bottom?</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              7 indicatori independenti. Fără bias. Doar date. Am analizat
              ciclurile trecute ale Bitcoin-ului ca să răspund la o singură
              întrebare: am ajuns la minimul acestui bear market?
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Autor: <strong className="text-slate-400">Alex Costea</strong> -
              fondator Armata de Traderi
            </p>

            <hr className="my-10 border-white/10" />

            {/* Intro */}
            <section className="mb-12">
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Bitcoin a atins un nou maxim istoric (ATH) de{" "}
                  <strong className="text-white">$126,208</strong> în octombrie
                  2025. De atunci, prețul a scăzut cu aproximativ 48%.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Întrebarea pe care și-o pune toată lumea:{" "}
                  <strong className="text-white">
                    s-a terminat scăderea sau mai vine?
                  </strong>
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Am analizat 7 metode diferite de calcul. Fiecare funcționează
                  independent. Niciuna nu se bazează pe alta. Și totuși, toate
                  arată spre aceeași zonă.
                </p>
              </div>
            </section>

            {/* Indicator 1: Cycle Timing */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                1. Cycle Timing - Ciclul de 4 Ani
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Bitcoin funcționează în cicluri de aproximativ 4 ani. De la
                  minimul unui ciclu până la maximul următor trec cam{" "}
                  <strong className="text-white">1060 de zile</strong> (aproape
                  3 ani).
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Hai să verificăm dacă pattern-ul (tipar) s-a respectat:
                </p>
                <ul className="mt-4 space-y-2 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      Ciclul 2017: <strong className="text-white">1068 zile</strong> de la
                      minim la maxim
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      Ciclul 2021: <strong className="text-white">1061 zile</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      Ciclul 2025: <strong className="text-white">1050 zile</strong> (din
                      noiembrie 2022 până în octombrie 2025)
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Același tipar se vede și în relația cu{" "}
                  <strong className="text-white">halving-ul</strong> (momentul
                  când recompensa minerilor se înjumătățește, un eveniment care
                  are loc la fiecare ~4 ani). Topul vine de obicei la 17-18 luni
                  după halving. Ciclul actual: 17.5 luni.
                </p>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Concluzie: Ciclul de 4 ani s-a respectat. Topul este confirmat.
                  Acum suntem în faza de scădere.
                </p>
              </div>
            </section>

            {/* Indicator 2: ATH Before Halving */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                2. ATH Înainte de Halving - O Premieră Istorică
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  În fiecare ciclu anterior, Bitcoin a făcut maximul istoric
                  (ATH) la{" "}
                  <strong className="text-white">
                    12-18 luni DUPĂ halving
                  </strong>
                  . Nu a existat nicio excepție.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  De data asta, Bitcoin a atins $73,750 în martie 2024 -{" "}
                  <strong className="text-white">cu o lună ÎNAINTE</strong> de
                  halving-ul din aprilie 2024. Nu s-a mai întâmplat niciodată.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  De ce? Aprobarea ETF-urilor Bitcoin (fonduri tranzacționate la
                  bursă care permit instituțiilor mari să cumpere Bitcoin ușor)
                  în ianuarie 2024 a adus un val masiv de cerere instituțională.
                  Practic, ETF-urile au tras ciclul înainte.
                </p>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Ce înseamnă asta: ETF-urile au schimbat structura pieței.
                  Bear market-ul (piața în scădere) ar putea fi mai scurt și mai
                  puțin dureros decât cele anterioare.
                </p>
              </div>
            </section>

            {/* Indicator 3: Diminishing Returns */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                3. Randamente Descrescătoare - Piața se Maturizează
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Cu fiecare ciclu, Bitcoin crește mai puțin (pentru că
                  capitalizarea e mai mare), dar și scade mai puțin. Piața se
                  maturizează.
                </p>
                <p className="mt-4 text-lg font-semibold text-white">
                  Cât a crescut din minim în maxim:
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2013: 553x (de la $2 la $1,150)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2017: ~20x</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2021: ~4x</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2025: ~2x</span>
                  </li>
                </ul>
                <p className="mt-4 text-lg font-semibold text-white">
                  Cât a scăzut de la maxim (drawdown):
                </p>
                <ul className="mt-2 space-y-2 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2014: -86.8%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2018: -83.8%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>2022: -77.6%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2026: estimat{" "}
                      <strong className="text-white">-52% până la -57%</strong>{" "}
                      - adică zona $54,000-$60,000
                    </span>
                  </li>
                </ul>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Concluzie: Crash-urile devin din ce în ce mai mici. Dacă
                  trendul se respectă, bottom-ul (minimul) ar fi undeva între
                  $54K și $60K.
                </p>
              </div>
            </section>

            {/* Indicator 4: Gold vs Bitcoin */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                4. Aurul vs Bitcoin - Cine Câștigă în Bear Market
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Există un tipar interesant: în perioadele de scădere ale
                  Bitcoin-ului, aurul performează mai bine. Raportul{" "}
                  <strong className="text-white">XAU/BTC</strong> (cât aur poți
                  cumpăra cu un Bitcoin) scade la topul BTC și crește până la
                  bottom-ul BTC.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Pe scurt: când aurul devine din ce în ce mai scump raportat la
                  Bitcoin, înseamnă că bear market-ul Bitcoin e în desfășurare.
                  Când creșterea raportului încetinește, bottom-ul se apropie.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Istoric, când raportul XAU/BTC a crescut cu{" "}
                  <strong className="text-white">70-80%</strong> de la minim,
                  Bitcoin-ul era aproape de bottom.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Raportul XAU/BTC a pus minimul la 0.024 în octombrie 2025
                  (când BTC era la ATH). Acum este la 0.046 - o creștere de{" "}
                  <strong className="text-white">+92%</strong>.
                </p>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Concluzie: Am depășit pragul de 80%. Conform acestui
                  indicator, suntem la sau foarte aproape de bottom.
                </p>
              </div>
            </section>

            {/* Indicator 5: Weekly RSI */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                5. RSI Săptămânal Sub 30 - Semnalul Care Nu a Dat Greș Niciodată
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  <strong className="text-white">RSI</strong> (Relative Strength
                  Index) este un indicator tehnic care măsoară cât de
                  &ldquo;supravândut&rdquo; sau &ldquo;supracumpărat&rdquo; este
                  un activ. Când RSI-ul săptămânal scade sub 30, înseamnă că
                  vânzătorii au exagerat.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  De fiecare dată când RSI-ul săptămânal al Bitcoin-ului a coborât
                  sub 30, a urmat o creștere masivă:
                </p>
                <ul className="mt-4 space-y-2 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2012: RSI sub 30 - a urmat bull run-ul (creștere majoră)
                      din 2013 până la $1,150
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2015: RSI sub 30 - a marcat exact bottom-ul bear
                      market-ului la $152
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      Martie 2020: RSI 29.5 - a urmat o creștere de{" "}
                      <strong className="text-white">+1,002%</strong> în 12 luni
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      Iunie 2022: RSI 25.8 - a urmat o creștere de +59% în 12
                      luni (deși FTX a cauzat un retest cu -15%)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      Februarie 2026: RSI 26.8 -{" "}
                      <strong className="text-white">acum suntem aici</strong>
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  5 din 5 cazuri. Rata de succes de 100%.
                </p>
                <p className="mt-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4 text-base text-yellow-200">
                  Atenție: În 2022, după primul semnal RSI sub 30, prețul a mai
                  scăzut cu 15% (din cauza falimentului FTX). Un retest al zonei
                  $56-60K este posibil înainte de recuperarea completă.
                </p>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Concluzie: Acesta este cel mai puternic semnal tehnic. Nu a dat
                  greș niciodată în toată istoria Bitcoin-ului.
                </p>
              </div>
            </section>

            {/* Indicator 6: Fed Funds Rate */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                6. Teoria Ratei Fed - Puncte de Bază = Zile Până la Bottom
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  <strong className="text-white">Fed</strong> (Federal Reserve)
                  este banca centrală a SUA. Ea controlează rata dobânzii de
                  referință. Când crește rata, banii devin mai scumpi (piețele
                  scad). Când o taie, banii devin mai ieftini (piețele cresc).
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Un <strong className="text-white">punct de bază (bps)</strong>{" "}
                  = 0.01%. Deci 550 bps = o rată de 5.50%. Există o corelație
                  fascinantă: numărul de puncte de bază de la care Fed-ul începe
                  să taie rata este aproape egal cu numărul de zile până când
                  piața pune bottom-ul.
                </p>
                <ul className="mt-4 space-y-2 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2000: a început tăierile de la 650 bps - bottom-ul
                      S&P500 a venit după 644 zile (raport 0.99x)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2007: a început de la 525 bps - bottom-ul a venit după
                      538 zile (raport 1.02x)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2019: a început de la 250 bps - bottom-ul a venit după
                      236 zile (raport 0.94x)
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Toate cele 3 cazuri au un raport între 0.94x și 1.02x.
                  Remarcabil de consistent.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  În 2024, Fed-ul a început tăierile pe 18 septembrie de la 550
                  bps. 550 de zile de la 18 septembrie ={" "}
                  <strong className="text-white">22 martie 2026</strong>.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Bonus: în mai 2026 se schimbă președintele Fed-ului, ceea ce
                  ar putea aduce o schimbare de politică monetară.
                </p>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Concluzie: Conform acestei teorii, suntem chiar în fereastra
                  de bottom previzionată.
                </p>
              </div>
            </section>

            {/* Indicator 7: Days from ATH Break */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                7. Zile de la Spargerea Fostului ATH
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Când Bitcoin depășește maximul istoric din ciclul anterior
                  pentru prima dată, ceasul începe să ticăie. Din acel moment,
                  bottom-ul următorului bear market vine la aproximativ{" "}
                  <strong className="text-white">700 de zile</strong>.
                </p>
                <ul className="mt-4 space-y-2 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2013: a spart $32 (fostul ATH) - bottom-ul a venit 700
                      zile mai târziu
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2017: a spart $1,150 - bottom-ul a venit după 680 zile
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      2021: a spart $20,000 - bottom-ul a venit după 700 zile
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  În ciclul actual, Bitcoin a spart fostul ATH de $69,000 în
                  martie 2024. Plus 693 de zile (media) ={" "}
                  <strong className="text-white">februarie 2026</strong>.
                </p>
                <p className="mt-4 rounded-xl bg-accent-emerald/5 p-4 text-base font-medium text-accent-emerald">
                  Concluzie: Am trecut deja de data estimată. Bottom-ul ar
                  trebui să fie deja format sau foarte aproape.
                </p>
              </div>
            </section>

            {/* Convergence */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Convergența - 6 Indicatori Arată Spre Același Punct
              </h2>
              <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Iată ce arată fiecare indicator independent:
                </p>
                <ul className="mt-4 space-y-3 text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#10003;</span>
                    <span>
                      <strong className="text-white">Teoria Ratei Fed:</strong>{" "}
                      martie 2026
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#10003;</span>
                    <span>
                      <strong className="text-white">
                        Zile de la spargerea ATH:
                      </strong>{" "}
                      februarie 2026
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#10003;</span>
                    <span>
                      <strong className="text-white">RSI sub 30:</strong>{" "}
                      februarie 2026
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#10003;</span>
                    <span>
                      <strong className="text-white">
                        Raport Aur/BTC peste 80%:
                      </strong>{" "}
                      martie 2026
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#10003;</span>
                    <span>
                      <strong className="text-white">
                        Cycle timing (topul confirmat):
                      </strong>{" "}
                      octombrie 2025
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#10003;</span>
                    <span>
                      <strong className="text-white">
                        Drawdown descrescător (-52%):
                      </strong>{" "}
                      zona $60K
                    </span>
                  </li>
                </ul>
                <p className="mt-6 text-lg font-semibold leading-relaxed text-white">
                  Șase semnale independente. Toate converg spre aceeași fereastră.
                  Nu este o singură teză - sunt șase lentile diferite care arată
                  aceeași imagine.
                </p>
              </div>
            </section>

            {/* Why Bullish */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                De Ce Sunt Optimist pe Termen Lung
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">
                        RSI sub 30 nu a dat greș niciodată.
                      </strong>{" "}
                      5 din 5 cazuri în toată istoria Bitcoin-ului.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">
                        Ciclul nu e &ldquo;stricat&rdquo; - se maturizează.
                      </strong>{" "}
                      Drawdown-ul de -48% (față de -78% ciclu trecut) este un
                      semn de putere, nu de slăbiciune.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">
                        ETF-urile au schimbat jocul.
                      </strong>{" "}
                      Bear market-urile anterioare: retail panic selling (oameni
                      obișnuiți care vând în panică). Acum: fonduri de pensii și
                      instituții cumpără pe scădere cu mandate structurale de
                      alocare. Există un &ldquo;podea&rdquo; care nu exista
                      înainte.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">
                        Următorul halving: aprilie 2028.
                      </strong>{" "}
                      Doi ani de acumulare înainte. Rally-ul pre-halving
                      începe de obicei la 12-18 luni înainte, adică în a doua
                      jumătate a lui 2026.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">
                        Bottom-ul la $54-60K
                      </strong>{" "}
                      ar fi de 3.5x mai sus decât bottom-ul din 2022 ($15,500).
                      Higher lows (minime din ce în ce mai mari) = trend
                      ascendent pe termen lung.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Risk */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Care Sunt Riscurile?
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Niciun indicator nu este perfect. Iată ce ar putea merge prost:
                </p>
                <ul className="mt-4 space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-red-400">&#9679;</span>
                    <span>
                      Un <strong className="text-white">retest</strong> al zonei
                      $56-60K este posibil înainte de recuperarea completă
                      (similar cu situația FTX din 2022).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-red-400">&#9679;</span>
                    <span>
                      <strong className="text-white">Teoria Ratei Fed</strong>{" "}
                      se bazează pe doar 3 puncte de date. Eșantionul e mic.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-red-400">&#9679;</span>
                    <span>
                      Un eveniment{" "}
                      <strong className="text-white">
                        &ldquo;black swan&rdquo;
                      </strong>{" "}
                      (eveniment neprevăzut - reglementări dure, faliment de
                      exchange, criză globală) poate invalida orice pattern peste
                      noapte.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-red-400">&#9679;</span>
                    <span>
                      Corelația nu înseamnă cauzalitate. Doar pentru că un tipar
                      s-a repetat de 3-5 ori nu garantează că se va repeta din
                      nou.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="mb-12">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 md:p-8">
                <h3 className="mb-3 text-lg font-bold text-yellow-200">
                  Disclaimer
                </h3>
                <p className="text-base leading-relaxed text-yellow-100/80">
                  Aceasta NU este o recomandare financiară. Este o analiză de
                  pattern-uri bazată pe date istorice. Pattern-urile trecute NU
                  garantează rezultate viitoare. Piețele pot și chiar se abat de
                  la normele istorice.
                </p>
                <p className="mt-3 text-base leading-relaxed text-yellow-100/80">
                  &ldquo;De data asta e diferit&rdquo; sunt cele mai periculoase
                  4 cuvinte în investiții. Dar la fel de periculoase sunt
                  &ldquo;funcționează mereu la fel&rdquo;.
                </p>
                <p className="mt-3 text-base leading-relaxed text-yellow-100/80">
                  Adevărul este: nimeni nu știe sigur. Ce avem este
                  probabilitate, nu certitudine. Nu risca niciodată mai mult
                  decât îți permiți să pierzi. Fă-ți propriile cercetări.
                </p>
                <p className="mt-4 text-sm font-medium text-yellow-200">
                  Analiză de Alex Costea - Date verificate cantitativ - Martie
                  2026
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-8 text-center md:p-10">
              <h3 className="text-2xl font-bold text-white md:text-3xl">
                Vrei mai multe analize ca aceasta?
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-lg text-slate-400">
                În comunitatea Elite primești analize săptămânale, sesiuni live
                și acces la indicatorii noștri exclusivi pe TradingView.
              </p>
              <Link
                href="/signup"
                className="accent-button mt-6 inline-flex items-center gap-2 px-8 py-3 text-lg font-bold"
              >
                Încearcă Gratuit 3 Zile &rarr;
              </Link>
            </div>

            {/* Back to blog */}
            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-400 hover:text-accent-emerald"
              >
                &larr; Înapoi la Blog
              </Link>
            </div>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
