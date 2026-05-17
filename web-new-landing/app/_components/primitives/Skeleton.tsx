export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-accent-dark/10 ${className}`}
      aria-hidden="true"
    />
  );
}
