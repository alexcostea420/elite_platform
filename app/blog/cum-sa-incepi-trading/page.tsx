import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Cum sa Incepi in Trading Crypto - Ghid Complet | Armata de Traderi",
  description:
    "Ghid complet pentru incepatori: ce trebuie sa inveti, cum sa-ti deschizi primul cont, cum sa-ti alegi strategia si cum sa gestionezi riscul in trading crypto.",
  keywords: [
    "cum sa incepi trading crypto",
    "ghid trading incepatori",
    "trading crypto romania",
    "risk management trading",
    "educatie trading",
  ],
  path: "/blog/cum-sa-incepi-trading",
  type: "article",
});

export default function CumSaIncepiTradingPage() {
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
              <span className="text-slate-400">Ghid Începători</span>
            </nav>

            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1 text-xs font-semibold text-accent-emerald">
                Educație
              </span>
              <span className="text-slate-500">2 Aprilie 2026</span>
              <span className="text-slate-500">8 min citire</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
              Cum să Începi în Trading Crypto -{" "}
              <span className="gradient-text">Ghid Complet pentru Începători</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              Dacă vrei să intri în lumea trading-ului crypto dar nu știi de unde să
              începi, acest ghid este pentru tine. Pas cu pas, de la zero la primele
              trade-uri.
            </p>

            <hr className="my-10 border-white/10" />

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Ce este trading-ul crypto și de ce e important
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Trading-ul crypto înseamnă cumpărarea și vânzarea de criptomonede (Bitcoin, Ethereum, Solana etc.) cu scopul de a obține profit din fluctuațiile de preț.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Spre deosebire de investiția pe termen lung, trading-ul presupune decizii active bazate pe analiză tehnică, fundamentală sau sentimentul pieței.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Piața crypto funcționează 24/7, ceea ce o face una dintre cele mai
                  dinamice piețe din lume. Dar tocmai de aceea, fără educație și
                  disciplină, pierderile pot fi semnificative. Un trader pregătit
                  știe exact când să intre, când să iasă și cât să riște.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Pasul 1: Educația - ce trebuie să înveți înainte
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Înainte să pui un singur ban pe piață, trebuie să înțelegi bazele.
                  Nu sări peste acest pas - este cel mai important.
                </p>
                <ul className="mt-4 space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Risk Management</strong> -
                      Cât ești dispus să pierzi pe un trade? Regula de aur: maxim
                      1-2% din capitalul total pe fiecare trade. Aceasta te protejează
                      de pierderi catastrofale.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Lot Size / Position Sizing</strong>{" "}
                      - Câți bani pui pe fiecare trade? Dimensiunea poziției trebuie
                      calculată în funcție de stop loss și risc maxim, nu &ldquo;la
                      ochi&rdquo;.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Suport și Rezistență</strong> -
                      Acestea sunt nivelurile de preț unde piața tinde să se oprească
                      sau să se inverseze. Înțelegerea lor este fundamentală pentru
                      orice strategie de trading.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Candlestick Patterns</strong> -
                      Graficele cu lumânări (candlestick) îți arată ce fac cumpărătorii
                      și vânzătorii în timp real. Învață pattern-urile de bază: pin bar,
                      engulfing, doji.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Pasul 2: Cont demo sau cont mic ($100–200)
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Nu începe niciodată cu bani pe care nu îți permiți să îi pierzi.
                  Cele mai bune opțiuni pentru început:
                </p>
                <ul className="mt-4 space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Cont demo</strong> - Majoritatea
                      exchange-urilor oferă conturi demo cu bani virtuali. Exersează
                      strategia fără risc real. Bybit, Binance și altele oferă
                      simulatoare bune.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Cont mic ($100–200)</strong> -
                      Dacă vrei să simți &ldquo;presiunea reală&rdquo;, începe cu o
                      sumă mică. Scopul nu este profitul, ci să înveți procesul:
                      intrare, stop loss, take profit, jurnal.
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Obiectivul în primele 3 luni nu e să faci bani - e să nu pierzi
                  mult și să înveți disciplina.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Pasul 3: Strategia - un singur setup, 100 de trade-uri
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Cea mai mare greșeală a începătorilor este să sară de la o strategie
                  la alta. Alege <strong className="text-white">un singur setup</strong>{" "}
                  și testează-l pe minim 100 de trade-uri înainte să tragi concluzii.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Un setup poate fi simplu: de exemplu, &ldquo;intru long când prețul
                  atinge suportul zilnic + formează un pin bar bullish pe 4H&rdquo;.
                  Definește clar regulile de intrare, stop loss și target.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Ține un jurnal de trading unde notezi fiecare trade: motivul
                  intrării, rezultatul, ce ai făcut bine și ce ai greșit. După 100
                  de trade-uri vei avea date reale despre performanța ta.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Pasul 4: Risk Management - max 1-2% per trade
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Risk management-ul este diferența dintre un trader care supraviețuiește
                  și unul care își pierde contul. Regulile de bază:
                </p>
                <ul className="mt-4 space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Max 1-2% risc per trade</strong> -
                      Dacă ai $1000, nu risca mai mult de $10-20 pe un singur trade.
                      Chiar și cu 10 pierderi consecutive (care se întâmplă), pierzi
                      doar 10-20%.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Stop loss obligatoriu</strong> -
                      Fiecare trade trebuie să aibă stop loss setat ÎNAINTE de intrare.
                      Nu &ldquo;ții și speri&rdquo; - dacă merge contra ta, ieși la
                      nivel predefinit.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-accent-emerald">&#9679;</span>
                    <span>
                      <strong className="text-white">Risk:Reward minim 1:2</strong> -
                      Dacă riști $10, target-ul tău trebuie să fie minim $20.
                      Astfel, chiar și cu un win rate de 40%, tot ești profitabil.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Pasul 5: Comunitate - nu tranzacționa singur
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Trading-ul poate fi izolant și frustrant. O comunitate de traderi
                  activi face diferența enormă: primești feedback, vezi cum gândesc
                  alții și înveți din greșelile altora (nu doar din ale tale).
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  <strong className="text-white">Armata de Traderi</strong> este
                  o comunitate de peste 350 de traderi activi, condusă de Alex Costea.
                  Cu sesiuni live, indicatori exclusivi TradingView, analize
                  săptămânale și un Discord activ, ai tot ce îți trebuie pentru a
                  accelera.
                </p>
              </div>
            </section>

            {/* Conclusion + CTA */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-accent-emerald">
                Concluzie
              </h2>
              <div className="rounded-2xl border border-white/10 bg-surface-graphite p-6 md:p-8">
                <p className="text-lg leading-relaxed text-slate-300">
                  Trading-ul crypto nu e un sprint - e un maraton. Succesul vine
                  din educație, disciplină, risk management strict și o comunitate
                  care te susține. Nu căuta &ldquo;schema magică&rdquo; - caută
                  procesul corect.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">
                  Rezumatul celor 5 pași: educă-te, exersează pe demo, alege un
                  singur setup, protejează-ți capitalul și alătură-te unei comunități
                  de traderi serioși.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-8 text-center md:p-10">
              <h3 className="text-2xl font-bold text-white md:text-3xl">
                Gata să faci primul pas?
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-lg text-slate-400">
                Încearcă gratuit 3 zile Armata de Traderi. Fără card, fără
                obligații. Primești acces complet la Discord, indicatori și video-uri.
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
