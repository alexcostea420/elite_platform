import Link from "next/link";

import { Container } from "@/components/ui/container";

type Props = {
  icon?: string;
  title?: string;
  subtitle?: string;
  description: string;
  highlight?: string;
  backHref?: string;
  backLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ComingSoon({
  icon = "🚀",
  title = "Coming Soon",
  subtitle,
  description,
  highlight,
  backHref = "/dashboard",
  backLabel = "Înapoi la Dashboard",
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <Container>
      <section className="panel mx-auto max-w-2xl p-8 text-center md:p-12">
        <div className="mb-4 text-5xl" aria-hidden="true">{icon}</div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-xl font-semibold text-accent-emerald">{subtitle}</p>
        )}
        <p className="mx-auto mt-4 max-w-lg text-slate-400">{description}</p>
        {highlight && (
          <p className="mt-4 text-sm font-semibold text-accent-emerald">{highlight}</p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="accent-button px-6 py-3" href={backHref}>
            {backLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link className="ghost-button px-6 py-3" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </section>
    </Container>
  );
}
