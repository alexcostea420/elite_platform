export function AuroraBg({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-emerald-500/20 blur-[120px] animate-aurora-slow" />
      <div className="absolute -bottom-40 right-1/4 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-[140px] animate-aurora-slow [animation-delay:-6s]" />
      <div className="absolute top-1/3 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px] animate-aurora-slow [animation-delay:-12s]" />
    </div>
  );
}
