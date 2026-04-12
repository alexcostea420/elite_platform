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
            Ultima actualizare: 5 aprilie 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Despre platforma">
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

            <Section title="2. Eligibilitate">
              <p>
                Pentru a utiliza platforma, trebuie să ai minim 18 ani. Prin
                crearea unui cont, confirmi că îndeplinești această cerință.
              </p>
            </Section>

            <Section title="3. Conturi si acces">
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

            <Section title="4. Trial gratuit">
              <p>
                La înregistrare, primești automat 3 zile de acces gratuit la
                conținutul Elite. Nu este necesară nicio plată sau card. După
                cele 3 zile, contul revine automat la planul Free.
              </p>
            </Section>

            <Section title="5. Planuri și prețuri">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>30 Zile:</strong> $49 USDT
                </li>
                <li>
                  <strong>90 Zile:</strong> $137 USDT
                </li>
                <li>
                  <strong>365 Zile:</strong> $497 USDT
                </li>
              </ul>
              <p className="mt-2">
                Prețurile sunt în dolari americani (USD) și se plătesc în USDT
                (stablecoin crypto). Planurile oferă acces pe durată fixă și nu
                se reînnoiesc automat.
              </p>
            </Section>

            <Section title="6. Plăți crypto">
              <ul className="list-disc space-y-1 pl-5">
                <li>Plățile se fac exclusiv în USDT pe rețeaua Arbitrum.</li>
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

            <Section title="7. Rambursări">
              <p>
                Poți solicita o rambursare completă în primele 7 zile de la
                activare, contactându-ne la{" "}
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:armatadetraderi@gmail.com"
                >
                  armatadetraderi@gmail.com
                </a>
                . După 7 zile, plățile nu sunt rambursabile.
              </p>
            </Section>

            <Section title="8. Ce primești">
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

            <Section title="9. Limitarea răspunderii">
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
                  Alex Costea si Armata de Traderi nu sunt responsabili pentru
                  pierderile financiare suferite.
                </li>
              </ul>
            </Section>

            <Section title="10. Proprietate intelectuală">
              <p>
                Tot conținutul de pe platformă (video-uri, analize, indicatori,
                materiale educaționale) este proprietatea Armata de Traderi.
                Redistribuirea, copierea sau partajarea conținutului fără acord
                scris este interzisă.
              </p>
            </Section>

            <Section title="11. Modificări ale termenilor">
              <p>
                Ne rezervăm dreptul de a modifica acești termeni. Modificările
                importante vor fi comunicate prin email sau pe Discord. Continuarea
                utilizării platformei după modificări constituie acceptarea noilor
                termeni.
              </p>
            </Section>

            <Section title="12. Legislație aplicabilă">
              <p>
                Acești termeni sunt guvernați de legislația din România. Orice
                dispută va fi soluționată conform legilor române, în instanța
                competentă din România.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                Pentru întrebări legate de acești termeni, ne poți contacta la:{" "}
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:armatadetraderi@gmail.com"
                >
                  armatadetraderi@gmail.com
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
