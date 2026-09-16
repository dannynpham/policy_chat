"use client";

import clsx from "clsx";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({
  label = "Loading",
  className,
}: LoadingSpinnerProps) {
  return (
    <span className={clsx("inline-flex items-center", className)} role="status">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}