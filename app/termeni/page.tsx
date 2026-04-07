import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Termeni si Conditii | Armata de Traderi",
  description:
    "Termenii si conditiile de utilizare a platformei Armata de Traderi. Comunitate educationala de trading crypto.",
  keywords: [
    "termeni si conditii",
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
            Termeni si Conditii
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Ultima actualizare: 5 aprilie 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Despre platforma">
              <p>
                Armata de Traderi este o comunitate educationala de trading crypto,
                administrata de Alex Costea. Platforma ofera acces la continut
                educational, sesiuni live, analize si o comunitate pe Discord.
              </p>
              <p className="mt-2 font-semibold text-amber-400">
                Aceasta platforma NU ofera sfaturi financiare, de investitii sau
                recomandari de tranzactionare. Tot continutul este strict
                educational.
              </p>
            </Section>

            <Section title="2. Eligibilitate">
              <p>
                Pentru a utiliza platforma, trebuie sa ai minim 18 ani. Prin
                crearea unui cont, confirmi ca indeplinesti aceasta cerinta.
              </p>
            </Section>

            <Section title="3. Conturi si acces">
              <ul className="list-disc space-y-1 pl-5">
                <li>Fiecare utilizator are dreptul la un singur cont.</li>
                <li>Esti responsabil pentru securitatea contului tau.</li>
                <li>Nu ai voie sa imparti accesul cu alte persoane.</li>
                <li>
                  Conturile care incalca regulile pot fi suspendate fara
                  rambursare.
                </li>
              </ul>
            </Section>

            <Section title="4. Trial gratuit">
              <p>
                La inregistrare, primesti automat 3 zile de acces gratuit la
                continutul Elite. Nu este necesara nicio plata sau card. Dupa
                cele 3 zile, contul revine automat la planul Free.
              </p>
            </Section>

            <Section title="5. Planuri si preturi">
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
                Preturile sunt in dolari americani (USD) si se platesc in USDT
                (stablecoin crypto). Planurile ofera acces pe durata fixa si nu
                se reinnoiesc automat.
              </p>
            </Section>

            <Section title="6. Plati crypto">
              <ul className="list-disc space-y-1 pl-5">
                <li>Platile se fac exclusiv in USDT pe reteaua Arbitrum.</li>
                <li>
                  Trebuie sa trimiti suma exacta indicata la momentul platii
                  (include o referinta unica in centime).
                </li>
                <li>
                  Platile sunt procesate automat dupa confirmarea pe blockchain.
                </li>
                <li>
                  Platile care nu sunt confirmate in 30 de minute expira automat
                  si trebuie reinitiate.
                </li>
              </ul>
            </Section>

            <Section title="7. Rambursari">
              <p>
                Poti solicita o rambursare completa in primele 7 zile de la
                activare, contactandu-ne la{" "}
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:armatadetraderi@gmail.com"
                >
                  armatadetraderi@gmail.com
                </a>
                . Dupa 7 zile, platile nu sunt rambursabile.
              </p>
            </Section>

            <Section title="8. Ce primesti">
              <ul className="list-disc space-y-1 pl-5">
                <li>Acces la canalele Elite pe serverul Discord</li>
                <li>Biblioteca video educationala</li>
                <li>Sesiuni live de trading</li>
                <li>Analize saptamanale</li>
                <li>Indicator ELITE pentru TradingView</li>
              </ul>
              <p className="mt-2">
                Accesul la Discord se acorda automat dupa confirmarea platii si
                conectarea contului Discord.
              </p>
            </Section>

            <Section title="9. Limitarea raspunderii">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Trading-ul crypto implica riscuri semnificative, inclusiv
                  pierderea totala a capitalului investit.
                </li>
                <li>
                  Nu garantam niciun randament, profit sau rezultat financiar.
                </li>
                <li>
                  Deciziile de tranzactionare iti apartin in totalitate.
                </li>
                <li>
                  Alex Costea si Armata de Traderi nu sunt responsabili pentru
                  pierderile financiare suferite.
                </li>
              </ul>
            </Section>

            <Section title="10. Proprietate intelectuala">
              <p>
                Tot continutul de pe platforma (video-uri, analize, indicatori,
                materiale educationale) este proprietatea Armata de Traderi.
                Redistribuirea, copierea sau partajarea continutului fara acord
                scris este interzisa.
              </p>
            </Section>

            <Section title="11. Modificari ale termenilor">
              <p>
                Ne rezervam dreptul de a modifica acesti termeni. Modificarile
                importante vor fi comunicate prin email sau pe Discord. Continuarea
                utilizarii platformei dupa modificari constituie acceptarea noilor
                termeni.
              </p>
            </Section>

            <Section title="12. Legislatie aplicabila">
              <p>
                Acesti termeni sunt guvernati de legislatia din Romania. Orice
                disputa va fi solutionata conform legilor romane, in instanta
                competenta din Romania.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                Pentru intrebari legate de acesti termeni, ne poti contacta la:{" "}
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
