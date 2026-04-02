import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signupWithInviteAction } from "@/app/auth/actions";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { validateInviteToken } from "@/lib/invites/server";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata({
  title: "Invitație Elite | Activează Accesul Premium",
  description: "Folosește invitația pentru a-ți crea cont și a activa automat accesul Elite.",
  keywords: ["invitatie elite", "activare acces premium", "armata de traderi"],
  path: "/invite",
  host: "app",
  index: false,
});

type InvitePageProps = {
  params: { token: string };
  searchParams?: {
    error?: string;
  };
};

function getInviteDurationLabel(invite: { plan_duration: string; subscription_days: number }) {
  const labels: Record<string, string> = {
    "30_days": "30 zile",
    "90_days": "90 zile",
    "365_days": "365 zile",
  };
  return labels[invite.plan_duration] ?? `${invite.subscription_days} zile`;
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = params;

  // If user is already logged in, try to redeem directly
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already logged in — redirect to redeem route
    redirect(`/invite/${token}/redeem`);
  }

  // Validate token
  const { valid, invite, error: validationError } = await validateInviteToken(token);

  if (!valid || !invite) {
    return (
      <>
        <Navbar mode="marketing" />
        <main className="pb-16 pt-28">
          <Container className="max-w-xl">
            <section className="panel px-6 py-8 text-center md:px-8">
              <div className="text-5xl">--</div>
              <h1 className="mt-4 text-3xl font-bold text-white">Invitație invalidă</h1>
              <p className="mt-3 text-slate-400">{validationError}</p>
              <div className="mt-6">
                <Link className="accent-button" href="/signup">
                  Creează cont normal
                </Link>
              </div>
            </section>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar mode="marketing" />
      <main className="pb-16 pt-28">
        <Container className="max-w-xl">
          {/* Invite badge */}
          <section className="mb-6 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/5 px-5 py-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Invitație Elite
            </p>
            <p className="mt-2 text-lg text-white">
              Ai primit acces <span className="font-bold text-accent-emerald">Elite</span> pentru{" "}
              <span className="font-bold">{getInviteDurationLabel(invite)}</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Creează-ți contul și accesul se activează automat.</p>
          </section>

          <section className="panel px-6 py-8 md:px-8">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white">Creează-ți contul</h1>
              <p className="mt-3 text-slate-400">
                Completează datele și vei primi automat acces Elite.
              </p>
            </div>

            {searchParams?.error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {searchParams.error}
              </div>
            )}

            <form action={signupWithInviteAction} className="space-y-4">
              <input name="invite_token" type="hidden" value={token} />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="full_name">
                  Nume complet
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="full_name"
                  name="full_name"
                  placeholder="Numele tău complet"
                  required
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="discord_username">
                  Username Discord
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="discord_username"
                  name="discord_username"
                  placeholder="exemplu: alexcostea"
                  required
                  type="text"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="email"
                  name="email"
                  placeholder="nume@email.com"
                  required
                  type="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                  Parolă
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  id="password"
                  name="password"
                  placeholder="Minim 8 caractere"
                  required
                  type="password"
                />
              </div>
              <button className="accent-button w-full" type="submit">
                Creează cont și activează Elite
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Ai deja cont?{" "}
              <Link className="font-semibold text-accent-emerald hover:text-crypto-green" href={`/login?next=/invite/${token}/redeem`}>
                Intră în cont
              </Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
