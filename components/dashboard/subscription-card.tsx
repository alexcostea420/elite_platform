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
    return { label: "Activ", className: "bg-crypto-dark/10 text-crypto-dark" };
  }

  if (subscriptionStatus === "trial") {
    return { label: "Trial", className: "bg-white/30 text-crypto-dark" };
  }

  if (subscriptionStatus === "cancelled") {
    return { label: "Anulat", className: "bg-amber-500/20 text-crypto-dark" };
  }

  if (subscriptionStatus === "expired") {
    return { label: "Expirat", className: "bg-red-500/20 text-crypto-dark" };
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
      ? { href: "/dashboard/videos", label: "Vezi biblioteca video" }
      : { href: "/upgrade", label: "Upgrade la Elite" };
  const secondaryCta =
    subscriptionTier === "elite"
      ? { href: "/dashboard", label: "Rămâi în dashboard" }
      : { href: "/dashboard/videos", label: "Vezi ce este disponibil" };

  return (
    <section className="mb-8 rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 px-6 py-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        {/* Left: status + info */}
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badge.className}`}>{badge.label}</span>
          <div>
            <p className="text-xl font-bold text-white">{copy.headline}</p>
            <p className="text-sm text-slate-400">{copy.description}</p>
          </div>
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
