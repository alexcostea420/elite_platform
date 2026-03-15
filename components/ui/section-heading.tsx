type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, description, align = "center" }: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">{eyebrow}</p> : null}
      <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-lg text-slate-400">{description}</p> : null}
    </div>
  );
}
