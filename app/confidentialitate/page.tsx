import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politica de Confidențialitate | Armata de Traderi",
  description:
    "Politica de confidențialitate a platformei Armata de Traderi. Află cum colectăm și protejăm datele tale.",
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
            Politica de Confidențialitate
          </h1>
          <p className="mb-10 text-sm text-slate-500">
            Ultima actualizare: 15 aprilie 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <Section title="1. Cine suntem">
              <p>
                Armata de Traderi este o comunitate educațională de trading crypto,
                operată de:
              </p>
              <ul className="mt-2 list-none space-y-1 pl-0">
                <li>
                  <strong className="text-white">Costea Cristian-Alexandru PFA</strong>
                </li>
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
              <p className="mt-2">
                Site-ul nostru este{" "}
                <strong className="text-white">armatadetraderi.com</strong> și
                platforma de membri este la{" "}
                <strong className="text-white">app.armatadetraderi.com</strong>.
              </p>
            </Section>

            <Section title="2. Ce date colectăm">
              <p>Colectăm următoarele date atunci când îți creezi un cont sau utilizezi platforma:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Date de cont:</strong> adresa de email, numele complet,
                  username
                </li>
                <li>
                  <strong>Date Discord:</strong> username-ul și ID-ul Discord (dacă
                  îți conectezi contul)
                </li>
                <li>
                  <strong>Date de plată prin card:</strong> procesate exclusiv prin
                  Stripe. Nu stocăm datele cardului pe serverele noastre.
                </li>
                <li>
                  <strong>Date de plată crypto:</strong> suma plătită, hash-ul
                  tranzacției pe blockchain, adresa wallet-ului expeditor
                </li>
                <li>
                  <strong>Date de utilizare:</strong> pagini vizitate, acțiuni
                  pe platformă, data ultimei conectări
                </li>
              </ul>
            </Section>

            <Section title="3. Cum folosim datele">
              <ul className="list-disc space-y-1 pl-5">
                <li>Gestionarea contului tău și a abonamentului</li>
                <li>Acordarea accesului la conținutul Elite și Discord</li>
                <li>Trimiterea de notificări legate de contul tău</li>
                <li>Îmbunătățirea platformei și a conținutului</li>
                <li>Prevenirea fraudei și a abuzului</li>
              </ul>
            </Section>

            <Section title="4. Unde stocăm datele">
              <p>
                Datele sunt stocate în{" "}
                <strong className="text-white">Supabase</strong>, un serviciu de
                baze de date cu servere în Uniunea Europeană. Toate datele sunt
                criptate în tranzit (HTTPS/TLS) și la stocare.
              </p>
            </Section>

            <Section title="5. Servicii terțe">
              <p>
                Folosim următoarele servicii terțe care pot colecta date:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Stripe</strong> (Stripe Payments Europe, Ltd.) -
                  procesarea plăților cu card
                </li>
                <li>
                  <strong>Google Analytics</strong> - pentru înțelegerea
                  traficului și comportamentului pe site (date anonimizate)
                </li>
                <li>
                  <strong>Meta Pixel (Facebook)</strong> - pentru măsurarea
                  eficienței campaniilor de marketing
                </li>
                <li>
                  <strong>Plausible Analytics</strong> - analiză de trafic
                  (privacy-first, fără cookies)
                </li>
                <li>
                  <strong>Resend</strong> - trimiterea emailurilor tranzacționale
                </li>
                <li>
                  <strong>Cloudflare</strong> - hosting video și CDN
                </li>
                <li>
                  <strong>Vercel</strong> - hosting și livrarea paginilor web
                </li>
                <li>
                  <strong>Discord</strong> - pentru integrarea cu serverul
                  comunității
                </li>
              </ul>
            </Section>

            <Section title="6. Cookies">
              <p>
                Folosim cookie-uri esențiale pentru autentificare și funcționarea platformei.
              </p>
              <p className="mt-3">
                Stripe poate seta cookie-uri necesare pentru prevenirea fraudei și procesarea plăților.
              </p>
              <p className="mt-3">
                Serviciile terțe (Google Analytics, Meta Pixel) pot seta cookie-uri de urmărire.
              </p>
              <p className="mt-3">
                Poți dezactiva cookie-urile din setările browser-ului tău.
              </p>
            </Section>

            <Section title="7. Transfer internațional de date">
              <p>
                Datele tale pot fi transferate și procesate în afara țării tale de
                reședință:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Stripe</strong> - procesează date în UE/SEE
                </li>
                <li>
                  <strong>Supabase</strong> - servere în UE
                </li>
                <li>
                  <strong>Discord</strong> (SUA) - clauze contractuale standard
                  pentru protecția datelor
                </li>
              </ul>
            </Section>

            <Section title="8. Nu vindem datele tale">
              <p>
                Nu vindem, nu închiriem și nu distribuim datele tale personale
                către terți în scopuri de marketing. Datele tale sunt folosite
                exclusiv pentru funcționarea platformei.
              </p>
            </Section>

            <Section title="9. Drepturile tale">
              <p>Conform legislației europene (GDPR), ai următoarele drepturi:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Acces:</strong> poți solicita o copie a datelor tale
                </li>
                <li>
                  <strong>Rectificare:</strong> poți cere corectarea datelor
                  incorecte
                </li>
                <li>
                  <strong>Ștergere:</strong> poți solicita ștergerea completă a
                  contului și datelor tale
                </li>
                <li>
                  <strong>Portabilitate:</strong> poți primi datele tale
                  într-un format structurat
                </li>
                <li>
                  <strong>Opoziție:</strong> te poți opune prelucrării datelor
                  pentru marketing
                </li>
              </ul>
              <p className="mt-2">
                Pentru a exercita oricare dintre aceste drepturi, contactează-ne
                la adresa de mai jos.
              </p>
            </Section>

            <Section title="10. Retenția datelor">
              <p>
                Păstrăm datele contului tău cât timp acesta este activ. Dacă
                soliciți ștergerea contului, datele vor fi eliminate în maximum
                30 de zile. Datele de plată (hash tranzacție, sumă) pot fi
                păstrate pentru evidența contabilă conform legii române.
              </p>
            </Section>

            <Section title="11. Securitate">
              <p>
                Protejăm datele tale prin criptare, autentificare securizată și
                politici de acces restrictive (Row Level Security). Cu toate
                acestea, niciun sistem nu este 100% sigur, și nu putem garanta
                securitatea absolută.
              </p>
            </Section>

            <Section title="12. Modificări">
              <p>
                Această politică poate fi actualizată periodic. Modificările
                semnificative vor fi comunicate prin email sau pe platformă.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                Pentru orice întrebări legate de datele tale personale sau această
                politică, ne poți contacta la:
              </p>
              <p className="mt-2">
                <a
                  className="text-accent-emerald hover:underline"
                  href="mailto:contact@armatadetraderi.com"
                >
                  contact@armatadetraderi.com
                </a>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Costea Cristian-Alexandru PFA - Armata de Traderi
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
