import { quickLinks } from "@/lib/constants/site";

export function QuickLinks() {
  return (
    <section className="mb-8 grid gap-6 md:grid-cols-4">
      {quickLinks.map((link) => (
        <a key={link.title} className="panel card-hover group p-6 text-center" href={link.href} rel={link.href.startsWith("http") ? "noreferrer" : undefined} target={link.href.startsWith("http") ? "_blank" : undefined}>
          <div className="text-5xl">{link.icon}</div>
          <h3 className="mt-3 text-lg font-bold text-white group-hover:text-accent-emerald">{link.title}</h3>
          <p className="mt-2 text-sm text-slate-400">{link.description}</p>
        </a>
      ))}
    </section>
  );
}
