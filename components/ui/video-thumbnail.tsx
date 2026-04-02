function formatUploadDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

export function VideoTemplateThumbnail({
  tag,
  date,
  className,
}: {
  tag: string;
  date: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #0D1713 0%, #06110D 40%, #030806 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(105, 224, 143, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(105, 224, 143, 0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">{tag}</p>
        <p className="mt-2 text-lg font-bold text-white/80">{formatUploadDate(date)}</p>
      </div>
    </div>
  );
}
