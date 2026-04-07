import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politica de Confidentialitate | Armata de Traderi",
  description:
    "Politica de confidentialitate a platformei Armata de Traderi. Afla cum colectam si protejam datele tale.",
  keywords: [
    "politica de confidentialitate",
    "armata de traderi",
    "protectia datelor",
  ],
  path: "/confidentialitate",
  index: true,
});

export default function ConfidentialitatePage() {
  return (
    <>
      <Navbar mode="marketing" />
      <main className="min-h-screen bg-surface-night pt-24 pb-16">
        <Container className="max-w-3xl">
          <h1 className="gradient-text mb-2 font-display text-3xl font-bold md:text-4xl">
            Politica de Confidentialitate
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Ultima actualizare: 5 aprilie 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Cine suntem">
              <p>
                Armata de Traderi este o comunitate educationala de trading crypto,
                administrata de Alex Costea. Site-ul nostru este{" "}
                <strong className="text-white">armatadetraderi.com</strong> si
                platforma de membri este la{" "}
                <strong className="text-white">app.armatadetraderi.com</strong>.
              </p>
            </Section>

            <Section title="2. Ce date colectam">
              <p>Colectam urmatoarele date atunci cand iti creezi un cont sau utilizezi platforma:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Date de cont:</strong> adresa de email, numele complet,
                  username
                </li>
                <li>
                  <strong>Date Discord:</strong> username-ul si ID-ul Discord (daca
                  iti conectezi contul)
                </li>
                <li>
                  <strong>Date de plata:</strong> suma platita, hash-ul
                  tranzactiei pe blockchain, adresa wallet-ului expeditor
                </li>
                <li>
                  <strong>Date de utilizare:</strong> pagini vizitate, actiuni
                  pe platforma, data ultimei conectari
                </li>
              </ul>
              <p className="mt-2">
                Nu colectam date bancare sau de card de credit, deoarece platile
                se fac exclusiv prin crypto.
              </p>
            </Section>

            <Section title="3. Cum folosim datele">
              <ul className="list-disc space-y-1 pl-5">
                <li>Gestionarea contului tau si a abonamentului</li>
                <li>Acordarea accesului la continutul Elite si Discord</li>
                <li>Trimiterea de notificari legate de contul tau</li>
                <li>Imbunatatirea platformei si a continutului</li>
                <li>Prevenirea fraudei si a abuzului</li>
              </ul>
            </Section>

            <Section title="4. Unde stocam datele">
              <p>
                Datele sunt stocate in{" "}
                <strong className="text-white">Supabase</strong>, un serviciu de
                baze de date cu servere in Uniunea Europeana. Toate datele sunt
                criptate in tranzit (HTTPS/TLS) si la stocare.
              </p>
            </Section>

            <Section title="5. Servicii terte">
              <p>
                Folosim urmatoarele servicii terte care pot colecta date
                anonimizate:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Google Analytics</strong> - pentru intelegerea
                  traficului si comportamentului pe site (date anonimizate)
                </li>
                <li>
                  <strong>Meta Pixel (Facebook)</strong> - pentru masurarea
                  eficientei campaniilor de marketing
                </li>
                <li>
                  <strong>Vercel</strong> - hosting si livrarea paginilor web
                </li>
                <li>
                  <strong>Discord</strong> - pentru integrarea cu serverul
                  comunitatii
                </li>
              </ul>
            </Section>

            <Section title="6. Cookies">
              <p>
                Folosim cookie-uri esentiale pentru autentificare si functionarea
                platformei. Serviciile terte (Google Analytics, Meta Pixel) pot
                seta cookie-uri de urmarire. Poti dezactiva cookie-urile din
                setarile browser-ului tau.
              </p>
            </Section>

            <Section title="7. Nu vindem datele tale">
              <p>
                Nu vindem, nu inchiriem si nu distribuim datele tale personale
                catre terti in scopuri de marketing. Datele tale sunt folosite
                exclusiv pentru functionarea platformei.
              </p>
            </Section>

            <Section title="8. Drepturile tale">
              <p>Conform legislatiei europene (GDPR), ai urmatoarele drepturi:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Acces:</strong> poti solicita o copie a datelor tale
                </li>
                <li>
                  <strong>Rectificare:</strong> poti cere corectarea datelor
                  incorecte
                </li>
                <li>
                  <strong>Stergere:</strong> poti solicita stergerea completa a
                  contului si datelor tale
                </li>
                <li>
                  <strong>Portabilitate:</strong> poti primi datele tale
                  intr-un format structurat
                </li>
                <li>
                  <strong>Opozitie:</strong> te poti opune prelucrarii datelor
                  pentru marketing
                </li>
              </ul>
              <p className="mt-2">
                Pentru a exercita oricare dintre aceste drepturi, contacteaza-ne
                la adresa de mai jos.
              </p>
            </Section>

            <Section title="9. Retentia datelor">
              <p>
                Pastram datele contului tau cat timp acesta este activ. Daca
                soliciti stergerea contului, datele vor fi eliminate in maximum
                30 de zile. Datele de plata (hash tranzactie, suma) pot fi
                pastrate pentru evidenta contabila conform legii romane.
              </p>
            </Section>

            <Section title="10. Securitate">
              <p>
                Protejam datele tale prin criptare, autentificare securizata si
                politici de acces restrictive (Row Level Security). Cu toate
                acestea, niciun sistem nu este 100% sigur, si nu putem garanta
                securitatea absoluta.
              </p>
            </Section>

            <Section title="11. Modificari">
              <p>
                Aceasta politica poate fi actualizata periodic. Modificarile
                semnificative vor fi comunicate prin email sau pe platforma.
              </p>
            </Section>

            <Section title="12. Contact">
              <p>
                Pentru orice intrebari legate de datele tale personale sau aceasta
                politica, ne poti contacta la:
              </p>
              <p className="mt-2">
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:armatadetraderi@gmail.com"
                >
                  armatadetraderi@gmail.com
                </a>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Alex Costea - Armata de Traderi
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
