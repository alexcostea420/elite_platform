import { Container } from "@/components/ui/container";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

type StatItem = {
  value: string;
  label: string;
  tone: string;
};

function parseStatValue(value: string): { num: number; prefix: string; suffix: string } {
  const match = value.match(/^([^\d]*)(\d+)(.*)$/);
  if (!match) return { num: 0, prefix: "", suffix: value };
  return { num: parseInt(match[2], 10), prefix: match[1], suffix: match[3] };
}

export function StatsSection({ stats }: { stats?: StatItem[] }) {
  const items = stats ?? [
    { value: "350+", label: "Membri in Comunitate", tone: "gold" },
    { value: "55+", label: "Video-uri Elite", tone: "green" },
    { value: "4+", label: "Ani de Experienta", tone: "gold" },
    { value: "7 ZILE", label: "Trial Gratuit", tone: "green" },
  ];

  return (
    <section className="border-y border-white/5 py-12">
      <Container>
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {items.map((stat, i) => {
            const { num, prefix, suffix } = parseStatValue(stat.value);
            return (
              <ScrollReveal key={stat.label} delay={i * 0.08}>
                <div className={`mb-2 text-4xl font-bold ${stat.tone === "green" ? "text-crypto-green" : "text-accent-emerald"}`}>
                  {num > 0 ? (
                    <NumberTicker value={num} prefix={prefix} suffix={suffix} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
