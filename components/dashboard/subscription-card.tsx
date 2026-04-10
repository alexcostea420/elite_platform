import Link from "next/link";

type SubscriptionTier = "free" | "elite" | null;
type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial" | null;

type SubscriptionCardProps = {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null;
  discordConnected?: boolean;
  discordUsername?: string | null;
};

const tierLabels: Record<Exclude<SubscriptionTier, null>, string> = {
  free: "Free",
  elite: "Elite",
};

function getRemainingDays(subscriptionExpiresAt: string | null) {
  if (!subscriptionExpiresAt) {
    return null;
  }

  const expiresAt = new Date(subscriptionExpiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return null;
  }

  const diffMs = expiresAt.getTime() - Date.now();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getSubscriptionCopy(
  subscriptionTier: SubscriptionTier,
  subscriptionStatus: SubscriptionStatus,
  subscriptionExpiresAt: string | null,
) {
  const tierLabel = subscriptionTier ? tierLabels[subscriptionTier] : "membru";
  const remainingDays = getRemainingDays(subscriptionExpiresAt);

  if (subscriptionStatus === "expired" || (remainingDays === 0 && subscriptionExpiresAt)) {
    return {
      headline: "Perioada ta de acces a expirat",
      description: `Accesul pentru planul ${tierLabel} nu mai este activ.`,
    };
  }

  if (subscriptionStatus === "cancelled") {
    return {
      headline: remainingDays && remainingDays > 0 ? `${remainingDays} zile rămase` : "Acces oprit",
      description:
        remainingDays && remainingDays > 0
          ? `Planul tău ${tierLabel} rămâne activ până la expirare.`
          : `Planul tău ${tierLabel} nu mai este activ.`,
    };
  }

  if (subscriptionStatus === "trial") {
    return {
      headline: remainingDays && remainingDays > 0 ? `${remainingDays} zile rămase` : "Perioadă de probă activă",
      description:
        remainingDays && remainingDays > 0
          ? `din perioada ta de probă ${tierLabel}`
          : tierLabel === "Free"
            ? "Contul tău este activ pe nivelul Free."
            : `Contul tău este în perioada de probă ${tierLabel}.`,
    };
  }

  if (remainingDays && remainingDays > 0) {
    return {
      headline: `${remainingDays} zile rămase`,
      description: `din perioada ta de acces ${tierLabel}`,
    };
  }

  if (subscriptionStatus === "active") {
    return {
      headline: `Plan ${tierLabel} activ`,
      description: "Accesul tău este activ fără o dată de expirare afișată.",
    };
  }

  return {
    headline: `Plan ${tierLabel}`,
    description: "Starea accesului tău nu este disponibilă momentan.",
  };
}

function getStatusBadge(subscriptionStatus: SubscriptionStatus) {
  if (subscriptionStatus === "active") {
    return { label: "Activ", className: "bg-accent-emerald/20 text-accent-emerald" };
  }

  if (subscriptionStatus === "trial") {
    return { label: "Trial", className: "bg-white/20 text-white" };
  }

  if (subscriptionStatus === "cancelled") {
    return { label: "Anulat", className: "bg-amber-500/20 text-amber-400" };
  }

  if (subscriptionStatus === "expired") {
    return { label: "Expirat", className: "bg-red-500/20 text-red-400" };
  }

  return { label: "Necunoscut", className: "bg-white/25 text-crypto-dark" };
}

export function SubscriptionCard({
  subscriptionTier,
  subscriptionStatus,
  subscriptionExpiresAt,
  discordConnected = false,
  discordUsername = null,
}: SubscriptionCardProps) {
  const copy = getSubscriptionCopy(subscriptionTier, subscriptionStatus, subscriptionExpiresAt);
  const badge = getStatusBadge(subscriptionStatus);
  const primaryCta =
    subscriptionTier === "elite"
      ? { href: "/upgrade", label: "Prelungeste abonamentul" }
      : { href: "/upgrade", label: "Upgrade la Elite" };
  const secondaryCta =
    subscriptionTier === "elite"
      ? { href: "/dashboard/videos", label: "Vezi biblioteca video" }
      : { href: "/dashboard/videos", label: "Vezi ce este disponibil" };

  return (
    <section className="mb-8 rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 px-6 py-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        {/* Left: status + info + discord sync */}
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badge.className}`}>{badge.label}</span>
          <div>
            <p className="text-xl font-bold text-white">{copy.headline}</p>
            <p className="text-sm text-slate-400">{copy.description}</p>
          </div>
          {subscriptionTier === "elite" && !discordConnected && (
            <Link
              className="ml-2 flex items-center gap-2 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4752C4]"
              href="/auth/discord/start"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Sincronizeaza Discord
            </Link>
          )}
        </div>
        {/* Right: buttons */}
        <div className="flex gap-3">
          <Link className="rounded-xl bg-accent-emerald px-5 py-2.5 text-sm font-semibold text-crypto-dark hover:bg-accent-soft" href={primaryCta.href}>
            {primaryCta.label}
          </Link>
          <Link className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5" href={secondaryCta.href}>
            {secondaryCta.label}
          </Link>
        </div>
      </div>
      {/* Discord status - compact inline */}
      {subscriptionTier === "elite" && (
        <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
          {discordConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-slate-400">Discord: <span className="text-white">{discordUsername ?? "conectat"}</span></span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-400">Discord neconectat</span>
              <Link className="ml-auto rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4752C4]" href="/auth/discord/start">
                Conecteaza
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}
