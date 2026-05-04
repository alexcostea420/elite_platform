type Props = {
  message?: string;
};

export function PageLoader({ message = "Se încarcă..." }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-accent-emerald border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}
