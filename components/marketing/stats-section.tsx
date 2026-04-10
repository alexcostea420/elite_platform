import { Container } from "@/components/ui/container";
import { heroStats } from "@/lib/constants/site";
import { AnimatedCounter } from "@/components/ui/animated-counter";

function parseStatValue(value: string): { num: number; prefix: string; suffix: string } {
  const match = value.match(/^([^\d]*)(\d+)(.*)$/);
  if (!match) return { num: 0, prefix: "", suffix: value };
  return { num: parseInt(match[2], 10), prefix: match[1], suffix: match[3] };
}

export function StatsSection() {
  return (
    <section className="border-y border-white/5 py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {heroStats.map((stat, i) => {
            const { num, prefix, suffix } = parseStatValue(stat.value);
            return (
              <div key={stat.label} className={`animate-fade-in-up stagger-${i + 1}`}>
                <div className={`mb-2 text-4xl font-bold ${stat.tone === "green" ? "text-crypto-green" : "text-accent-emerald"}`}>
                  {num > 0 ? (
                    <AnimatedCounter value={num} prefix={prefix} suffix={suffix} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
