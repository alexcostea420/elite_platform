import { Container } from "@/components/ui/container";
import { heroStats } from "@/lib/constants/site";

export function StatsSection() {
  return (
    <section className="border-y border-white/5 py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <div className={`mb-2 text-4xl font-bold ${stat.tone === "green" ? "text-crypto-green" : "text-accent-emerald"}`}>{stat.value}</div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
