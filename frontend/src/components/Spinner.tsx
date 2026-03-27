export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-600 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
