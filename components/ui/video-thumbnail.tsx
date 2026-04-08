import Image from "next/image";

function formatUploadDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

export function VideoTemplateThumbnail({
  tag,
  date,
  className,
  thumbnailUrl,
  title,
}: {
  tag: string;
  date: string;
  className?: string;
  thumbnailUrl?: string | null;
  title?: string;
}) {
  // Use generated thumbnail image if available
  if (thumbnailUrl) {
    return (
      <div className={`relative aspect-video overflow-hidden ${className ?? ""}`}>
        <Image
          alt={`${tag} - ${formatUploadDate(date)}`}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          src={thumbnailUrl}
        />
      </div>
    );
  }

  // Branded fallback with avatar
  return (
    <div
      className={`relative flex aspect-video items-end overflow-hidden ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #080808 0%, #0a1a0f 50%, #080808 100%)",
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11, 102, 35, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(11, 102, 35, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Avatar in top-right corner */}
      <div className="absolute right-3 top-3 h-12 w-12 overflow-hidden rounded-full border border-white/10">
        <Image
          alt="Armata de Traderi"
          className="object-cover"
          fill
          sizes="48px"
          src="/avatar-armata.jpg"
        />
      </div>

      {/* Green accent glow */}
      <div
        className="absolute bottom-0 left-0 h-1/2 w-full"
        style={{
          background: "linear-gradient(to top, rgba(11, 102, 35, 0.15), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative w-full p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-emerald">{tag}</p>
        {title && (
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-tight text-white">{title}</p>
        )}
        <p className="mt-1.5 text-[10px] text-slate-500">{formatUploadDate(date)}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-accent-emerald to-transparent opacity-50" />
    </div>
  );
}
