import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Termeni și Condiții | Armata de Traderi",
  description:
    "Termenii și condițiile de utilizare a platformei Armata de Traderi. Comunitate educațională de trading crypto.",
  keywords: [
    "termeni și condiții",
    "armata de traderi",
    "trading crypto romania",
  ],
  path: "/termeni",
  index: true,
});

export default function TermeniPage() {
  return (
    <>
      <Navbar mode="marketing" />
      <main className="min-h-screen bg-surface-night pt-24 pb-16">
        <Container className="max-w-3xl">
          <h1 className="gradient-text mb-2 font-display text-3xl font-bold md:text-4xl">
            Termeni și Condiții
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Ultima actualizare: 15 aprilie 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Identificarea operatorului">
              <p>
                Platforma Armata de Traderi (app.armatadetraderi.com) operată de:
              </p>
              <ul className="list-disc space-y-1 pl-5 mt-2">
                <li>
                  <strong>Costea Cristian-Alexandru PFA</strong>
                </li>
                <li>Cod CAEN: 6391 – Activități ale portalurilor web</li>
                <li>CUI: 54517198</li>
                <li>Nr. registrul comerțului: F2026020803003</li>
                <li>Sediu: B-dul Bucureștii Noi 136, parter, ap. 5, Sector 1, București</li>
                <li>
                  Email:{" "}
                  <a
                    className="text-accent-emerald hover:underline"
                    href="mailto:contact@armatadetraderi.com"
                  >
                    contact@armatadetraderi.com
                  </a>
                </li>
              </ul>
            </Section>

            <Section title="2. Obiectul contractului">
              <p>
                Armata de Traderi este o comunitate educațională de trading crypto,
                administrată de Alex Costea. Platforma oferă acces la conținut
                educațional, sesiuni live, analize și o comunitate pe Discord.
              </p>
              <p className="mt-2 font-semibold text-amber-400">
                Această platformă NU oferă sfaturi financiare, de investiții sau
                recomandări de tranzacționare. Tot conținutul este strict
                educațional.
              </p>
            </Section>

            <Section title="3. Eligibilitate">
              <p>
                Pentru a utiliza platforma, trebuie să ai minim 18 ani. Prin
                crearea unui cont, confirmi că îndeplinești această cerință.
              </p>
            </Section>

            <Section title="4. Conturi și acces">
              <ul className="list-disc space-y-1 pl-5">
                <li>Fiecare utilizator are dreptul la un singur cont.</li>
                <li>Ești responsabil pentru securitatea contului tău.</li>
                <li>Nu ai voie să împarți accesul cu alte persoane.</li>
                <li>
                  Conturile care încalcă regulile pot fi suspendate fără
                  rambursare.
                </li>
              </ul>
            </Section>

            <Section title="5. Trial gratuit">
              <p>
                La înregistrare, primești automat 7 zile de acces gratuit la
                conținutul Elite. Nu este necesară nicio plată sau card. După
                cele 7 zile, contul revine automat la planul Free.
              </p>
              <p className="mt-2">
                Perioada de probă se acordă o singură dată per utilizator.
              </p>
            </Section>

            <Section title="6. Planuri și prețuri">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>30 Zile:</strong> 49 EUR
                </li>
                <li>
                  <strong>90 Zile:</strong> 137 EUR
                </li>
                <li>
                  <strong>365 Zile:</strong> 497 EUR
                </li>
              </ul>
              <p className="mt-2">
                Prețurile sunt exprimate în EUR. Operatorul este neplătitor de
                TVA conform legislației în vigoare.
              </p>
              <p className="mt-2">
                Membrii veterani beneficiază de prețuri reduse: 33 EUR / 100 EUR
                / 300 EUR.
              </p>
              <p className="mt-2">
                Planurile oferă acces pe durată fixă și nu se reînnoiesc automat.
              </p>
            </Section>

            <Section title="7. Metode de plată">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Card bancar</strong> – procesat prin Stripe (Stripe
                  Payments Europe, Ltd., Irlanda).
                </li>
                <li>
                  <strong>Criptomonede</strong> – USDT/USDC pe rețeaua Arbitrum.
                </li>
              </ul>
              <p className="mt-3 font-medium text-white">
                Detalii plată crypto:
              </p>
              <ul className="list-disc space-y-1 pl-5 mt-1">
                <li>
                  Trebuie să trimiți suma exactă indicată la momentul plății
                  (include o referință unică în centime).
                </li>
                <li>
                  Plățile sunt procesate automat după confirmarea pe blockchain.
                </li>
                <li>
                  Plățile care nu sunt confirmate în 30 de minute expiră automat
                  și trebuie reinițiate.
                </li>
              </ul>
            </Section>

            <Section title="8. Rambursări">
              <p>
                Deoarece produsul oferit este conținut digital livrat instant,
                rambursările nu sunt posibile odată ce accesul la platformă a
                fost activat.
              </p>
              <p className="mt-2">
                Pentru detalii complete, consultă{" "}
                <a
                  className="text-accent-emerald hover:underline"
                  href="/rambursare"
                >
                  Politica de Rambursare
                </a>
                .
              </p>
            </Section>

            <Section title="9. Livrarea conținutului digital">
              <p>
                Serviciile oferite constituie conținut digital livrat instantaneu.
                Prin finalizarea plății, utilizatorul confirmă că este de acord
                cu livrarea imediată și își pierde dreptul de retragere conform
                OUG 34/2014 și Directiva 2011/83/UE.
              </p>
            </Section>

            <Section title="10. Ce primești">
              <ul className="list-disc space-y-1 pl-5">
                <li>Acces la canalele Elite pe serverul Discord</li>
                <li>Biblioteca video educațională</li>
                <li>Sesiuni live de trading</li>
                <li>Analize săptămânale</li>
                <li>Indicator ELITE pentru TradingView</li>
              </ul>
              <p className="mt-2">
                Accesul la Discord se acordă automat după confirmarea plății și
                conectarea contului Discord.
              </p>
            </Section>

            <Section title="11. Limitarea răspunderii">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Trading-ul crypto implică riscuri semnificative, inclusiv
                  pierderea totală a capitalului investit.
                </li>
                <li>
                  Nu garantăm niciun randament, profit sau rezultat financiar.
                </li>
                <li>
                  Deciziile de tranzacționare îți aparțin în totalitate.
                </li>
                <li>
                  Alex Costea și Armata de Traderi nu sunt responsabili pentru
                  pierderile financiare suferite.
                </li>
              </ul>
            </Section>

            <Section title="12. Proprietate intelectuală">
              <p>
                Tot conținutul de pe platformă (video-uri, analize, indicatori,
                materiale educaționale) este proprietatea Armata de Traderi.
                Redistribuirea, copierea sau partajarea conținutului fără acord
                scris este interzisă.
              </p>
              <p className="mt-2 font-semibold text-amber-400">
                Copierea sau partajarea conținutului duce la suspendarea imediată
                a contului, fără drept de rambursare.
              </p>
            </Section>

            <Section title="13. Suspendarea contului">
              <p>
                Contul poate fi suspendat fără preaviz și fără rambursare în
                următoarele situații:
              </p>
              <ul className="list-disc space-y-1 pl-5 mt-2">
                <li>Încălcarea acestor Termeni și Condiții</li>
                <li>
                  Copierea sau partajarea conținutului platformei cu terți
                </li>
                <li>Chargeback fraudulos (disputarea nejustificată a plății)</li>
                <li>
                  Crearea mai multor conturi pentru a abuza de perioada de trial
                </li>
              </ul>
            </Section>

            <Section title="14. Modificări ale termenilor">
              <p>
                Ne rezervăm dreptul de a modifica acești termeni. Modificările
                importante vor fi comunicate prin email sau pe Discord. Continuarea
                utilizării platformei după modificări constituie acceptarea noilor
                termeni.
              </p>
            </Section>

            <Section title="15. Legislație aplicabilă">
              <p>
                Acești termeni sunt guvernați de legislația din România. Orice
                dispută va fi soluționată conform legilor române.
              </p>
              <p className="mt-2">Organisme de soluționare a disputelor:</p>
              <ul className="list-disc space-y-1 pl-5 mt-1">
                <li>
                  <strong>ANPC</strong> – Autoritatea Națională pentru Protecția
                  Consumatorilor:{" "}
                  <a
                    className="text-accent-emerald hover:underline"
                    href="https://anpc.ro"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    anpc.ro
                  </a>
                </li>
                <li>
                  <strong>SAL</strong> – Soluționarea Alternativă a Litigiilor:{" "}
                  <a
                    className="text-accent-emerald hover:underline"
                    href="https://anpc.ro/ce-este-sal/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    anpc.ro/ce-este-sal/
                  </a>
                </li>
                <li>
                  <strong>SOL</strong> – Soluționarea Online a Litigiilor:{" "}
                  <a
                    className="text-accent-emerald hover:underline"
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ec.europa.eu/consumers/odr
                  </a>
                </li>
              </ul>
            </Section>

            <Section title="16. Contact">
              <p>
                Pentru întrebări legate de acești termeni, ne poți contacta la:{" "}
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
