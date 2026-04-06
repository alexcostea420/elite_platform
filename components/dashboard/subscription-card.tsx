import Link from "next/link";

type SubscriptionTier = "free" | "elite" | null;
type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial" | null;

type SubscriptionCardProps = {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null;
  discordConnected?: boolean;
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
    <section className="mb-8 rounded-[1.75rem] bg-emerald-gradient p-8 text-center text-crypto-dark shadow-glow">
      <div className="mb-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-crypto-dark/90">
        <span className={`rounded-full px-3 py-1 ${badge.className}`}>{badge.label}</span>
      </div>
      <div className="text-6xl">⏰</div>
      <div className="mt-4 text-5xl font-bold">{copy.headline}</div>
      <p className="mt-2 text-lg font-semibold text-crypto-dark/80">{copy.description}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link className="inline-flex items-center justify-center rounded-xl bg-crypto-dark px-6 py-3 font-semibold text-white hover:bg-crypto-ink" href={primaryCta.href}>
          {primaryCta.label}
        </Link>
        <Link className="inline-flex items-center justify-center rounded-xl border border-crypto-dark/20 px-6 py-3 font-semibold text-crypto-dark hover:bg-white/10" href={secondaryCta.href}>
          {secondaryCta.label}
        </Link>
      </div>
      {!discordConnected && subscriptionTier === "elite" && (
        <div className="mt-5 rounded-xl bg-crypto-dark/10 px-5 py-4">
          <p className="text-sm font-semibold text-crypto-dark">Conecteaza Discord pentru a primi rolul Elite</p>
          <Link
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4752C4]"
            href="/auth/discord/start"
          >
            Conecteaza Discord
          </Link>
        </div>
      )}
    </section>
  );
}
