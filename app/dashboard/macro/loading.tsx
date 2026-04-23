export default function MacroLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-accent-emerald border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">Se încarcă dashboard-ul macro...</p>
      </div>
    </div>
  );
}
