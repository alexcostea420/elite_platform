import Link from "next/link";

import { Container } from "@/components/ui/container";

type Props = {
  icon?: string;
  title?: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

export function ComingSoon({
  icon = "🚀",
  title = "Coming Soon",
  description,
  backHref = "/dashboard",
  backLabel = "Înapoi la Dashboard",
}: Props) {
  return (
    <Container>
      <section className="panel mx-auto max-w-lg p-8 text-center md:p-12">
        <div className="mb-4 text-5xl" aria-hidden="true">{icon}</div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="mx-auto mt-4 max-w-lg text-slate-400">{description}</p>
        <Link className="accent-button mt-6 inline-block" href={backHref}>
          {backLabel}
        </Link>
      </section>
    </Container>
  );
}
