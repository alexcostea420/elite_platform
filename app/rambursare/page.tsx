import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politica de Rambursare | Armata de Traderi",
  description:
    "Politica de rambursare pentru abonamentele Armata de Traderi. Conținut digital livrat instant.",
  keywords: [
    "politica de rambursare",
    "armata de traderi",
    "refund policy",
  ],
  path: "/rambursare",
  index: true,
});

export default function RambursarePage() {
  return (
    <>
      <Navbar mode="marketing" />
      <main className="min-h-screen bg-surface-night pt-24 pb-16">
        <Container className="max-w-3xl">
          <h1 className="gradient-text mb-2 font-display text-3xl font-bold md:text-4xl">
            Politica de Rambursare
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Ultima actualizare: 15 aprilie 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Natura produsului">
              <p>
                Armata de Traderi oferă <strong className="text-white">conținut digital livrat instantaneu</strong>.
                Imediat după confirmarea plății, utilizatorul primește acces complet la:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Canalele private Elite pe serverul Discord</li>
                <li>Biblioteca video educațională completă</li>
                <li>Instrumente de analiză (indicatori TradingView, Risk Score, Pivoti BTC)</li>
                <li>Resurse educaționale și ghiduri de trading</li>
              </ul>
            </Section>

            <Section title="2. Politica de rambursare">
              <p>
                Deoarece produsul oferit este conținut digital livrat instant și accesul se
                activează imediat după plată, <strong className="text-white">rambursările nu sunt posibile</strong> odată
                ce accesul la platformă a fost activat.
              </p>
              <p className="mt-3">
                Aceasta este în conformitate cu <strong className="text-white">OUG 34/2014</strong> (transpunerea
                Directivei 2011/83/UE privind drepturile consumatorilor), care prevede că
                dreptul de retragere nu se aplică contractelor de furnizare de conținut
                digital care nu este livrat pe un suport material, atunci când prestarea a
                început cu acordul prealabil expres al consumatorului.
              </p>
            </Section>

            <Section title="3. Consimțământul la checkout">
              <p>
                Înainte de finalizarea plății, utilizatorul bifează explicit:
              </p>
              <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm italic text-slate-200">
                  &quot;Sunt de acord cu livrarea imediată a conținutului digital și înțeleg că,
                  odată ce accesul a fost activat, îmi pierd dreptul de retragere conform
                  OUG 34/2014.&quot;
                </p>
              </div>
            </Section>

            <Section title="4. Perioadă de probă gratuită">
              <p>
                Pentru a permite utilizatorilor să evalueze platforma înainte de a plăti,
                oferim o <strong className="text-white">perioadă de probă gratuită de 7 zile</strong> cu acces complet
                la toate funcționalitățile Elite.
              </p>
              <p className="mt-2">
                Această perioadă permite testarea completă a produsului fără niciun risc
                financiar, eliminând necesitatea rambursărilor.
              </p>
            </Section>

            <Section title="5. Situații excepționale">
              <p>
                În cazuri excepționale (erori tehnice care împiedică accesul, plăți
                duplicate accidentale), utilizatorii pot contacta echipa de suport pentru
                analiza situației:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  <strong>Plăți duplicate:</strong> Dacă ai fost debitat de două ori
                  pentru aceeași perioadă, te rugăm să ne contactezi imediat. Vom verifica
                  și vom returna suma duplicată.
                </li>
                <li>
                  <strong>Erori tehnice:</strong> Dacă nu ai primit accesul în termen de
                  24 de ore de la confirmarea plății, contactează-ne pentru remediere.
                </li>
              </ul>
            </Section>

            <Section title="6. Chargebacks (contestații la bancă)">
              <p>
                Contestarea unei tranzacții la banca emitentă a cardului (chargeback) după
                ce ai primit și utilizat accesul la platformă este considerată{" "}
                <strong className="text-white">fraudă</strong> și va rezulta în:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Suspendarea imediată și permanentă a contului</li>
                <li>Eliminarea de pe serverul Discord</li>
                <li>Contestarea chargeback-ului cu dovezi de acces și utilizare</li>
              </ul>
            </Section>

            <Section title="7. Anularea abonamentului">
              <p>
                Abonamentele Armata de Traderi sunt pe durată fixă (30, 90 sau 365 zile)
                și <strong className="text-white">nu se reînnoiesc automat</strong>. Nu există
                obligația de a reînnoi. La expirarea perioadei, contul revine automat la
                planul gratuit.
              </p>
            </Section>

            <Section title="8. Contact">
              <p>
                Pentru orice problemă legată de plăți sau rambursări, contactează-ne la:
              </p>
              <p className="mt-2">
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:contact@armatadetraderi.com"
                >
                  contact@armatadetraderi.com
                </a>
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Timp de răspuns estimat: 24-48 ore lucrătoare.
              </p>
            </Section>

            <Section title="9. Organisme de soluționare a disputelor">
              <p>
                Dacă nu ești mulțumit de răspunsul nostru, te poți adresa:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  <strong>ANPC</strong> -{" "}
                  <a href="https://anpc.ro" className="text-accent-emerald hover:underline" target="_blank" rel="noreferrer">
                    anpc.ro
                  </a>
                </li>
                <li>
                  <strong>SAL</strong> -{" "}
                  <a href="https://anpc.ro/ce-este-sal/" className="text-accent-emerald hover:underline" target="_blank" rel="noreferrer">
                    Soluționarea Alternativă a Litigiilor
                  </a>
                </li>
                <li>
                  <strong>Platforma ODR</strong> -{" "}
                  <a href="https://ec.europa.eu/consumers/odr" className="text-accent-emerald hover:underline" target="_blank" rel="noreferrer">
                    Platforma europeană de soluționare online a disputelor
                  </a>
                </li>
              </ul>
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
