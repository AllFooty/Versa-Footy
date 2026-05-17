import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="font-display uppercase label-sm text-accent-dark/80"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="font-sans text-body-s text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="font-sans text-body-s text-warm-shadow">{hint}</p>
      ) : null}
    </div>
  );
}
