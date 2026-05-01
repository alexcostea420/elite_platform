import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Disclaimer și Risc | Armata de Traderi",
  description:
    "Disclaimer financiar și avertismente de risc pentru utilizatorii Armata de Traderi.",
  keywords: [
    "disclaimer financiar",
    "risc trading",
    "armata de traderi",
    "asf",
  ],
  path: "/disclaimer",
  index: true,
});

export default function DisclaimerPage() {
  return (
    <>
      <Navbar mode="marketing" />
      <main className="min-h-screen bg-surface-night pt-24 pb-16">
        <Container className="max-w-3xl">
          <h1 className="gradient-text mb-2 font-display text-3xl font-bold md:text-4xl">
            Disclaimer și Risc
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Ultima actualizare: 1 mai 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Caracter educațional">
              <p>
                Tot conținutul publicat pe Armata de Traderi are{" "}
                <strong className="text-white">caracter exclusiv educațional</strong>.
              </p>
              <p className="mt-3">
                Nu reprezintă recomandări de investiție, sfaturi financiare personalizate sau invitație de a tranzacționa.
              </p>
              <p className="mt-3">
                Fiecare utilizator este responsabil pentru propriile decizii financiare.
              </p>
            </Section>

            <Section title="2. Lipsa autorizării ASF">
              <p>
                Armata de Traderi <strong className="text-white">nu este autorizată</strong> de Autoritatea de Supraveghere Financiară (ASF) din România și nu oferă servicii financiare reglementate.
              </p>
              <p className="mt-3">
                Nu administrăm fonduri, nu intermediem tranzacții și nu oferim consultanță în baza Legii 297/2004 sau a OUG 32/2012.
              </p>
            </Section>

            <Section title="3. Riscul tranzacționării">
              <p>
                Tranzacționarea criptomonedelor și a oricăror instrumente financiare implică{" "}
                <strong className="text-white">riscuri semnificative</strong>.
              </p>
              <p className="mt-3">
                Volatilitatea ridicată poate duce la pierderi rapide și totale ale capitalului investit.
              </p>
              <p className="mt-3">
                Nu investi sume pe care nu îți permiți să le pierzi în întregime.
              </p>
            </Section>

            <Section title="4. Performanțe trecute">
              <p>
                Toate performanțele afișate pe platformă (track record, exemple de trade-uri, rezultate ale botului V5 Pro ML) sunt{" "}
                <strong className="text-white">istorice</strong>.
              </p>
              <p className="mt-3">
                Performanțele trecute nu garantează rezultate viitoare.
              </p>
              <p className="mt-3">
                Niciun setup, niciun semnal și niciun indicator nu are o rată de succes garantată.
              </p>
            </Section>

            <Section title="5. Responsabilitatea utilizatorului">
              <p>
                Utilizatorul este <strong className="text-white">singurul responsabil</strong> pentru:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Deciziile de investiție pe care le ia</li>
                <li>Sumele alocate fiecărei poziții</li>
                <li>Setările de risk management folosite</li>
                <li>Conformitatea fiscală cu legislația din țara de reședință</li>
              </ul>
              <p className="mt-3">
                Recomandăm consultarea unui consultant financiar autorizat înainte de a lua decizii majore de investiție.
              </p>
            </Section>

            <Section title="6. Indicatori, scoruri și semnale">
              <p>
                Risk Score, zonele de Buy/Sell pe acțiuni, Pivots BTC, Macro Dashboard și restul instrumentelor sunt{" "}
                <strong className="text-white">unelte de analiză</strong>, nu rețete de tranzacționare.
              </p>
              <p className="mt-3">
                Pot fi greșite. Pot rata mișcări. Pot da semnale false.
              </p>
              <p className="mt-3">
                Folosește-le ca pe un input între mai multe, nu ca pe singurul motiv pentru a deschide sau închide o poziție.
              </p>
            </Section>

            <Section title="7. Bot-ul V5 Pro ML și Copytrade">
              <p>
                Performanțele afișate pe pagina <a className="text-accent-emerald hover:underline" href="/track-record">/track-record</a> sunt din contul master anonimizat al lui Alex Costea.
              </p>
              <p className="mt-3">
                Rezultatele individuale ale celor care vor copia botul pot diferi din cauza slippage-ului, a comisioanelor brokerului folosit, a sumei de capital alocate și a momentului în care s-a făcut conectarea.
              </p>
              <p className="mt-3">
                Copytrade nu este disponibil încă. Va fi anunțat oficial când lansăm.
              </p>
            </Section>

            <Section title="8. Conținut terț">
              <p>
                Pe platformă sunt afișate date provenite din surse terțe (CoinGecko, Yahoo Finance, Forex Factory, Hyperliquid, Patreon, Discord).
              </p>
              <p className="mt-3">
                Nu garantăm acuratețea, completitudinea sau disponibilitatea continuă a acestor date.
              </p>
            </Section>

            <Section title="9. Modificări">
              <p>
                Acest disclaimer poate fi actualizat periodic.
              </p>
              <p className="mt-3">
                Continuarea utilizării platformei după publicarea unei versiuni noi reprezintă acceptarea acelei versiuni.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                Pentru întrebări legate de acest disclaimer:
              </p>
              <p className="mt-2">
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:contact@armatadetraderi.com"
                >
                  contact@armatadetraderi.com
                </a>
              </p>
            </Section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
