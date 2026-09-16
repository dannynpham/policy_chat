"use client";

import { useEffect } from "react";
import clsx from "clsx";

export type Toast = {
  id: number;
  message: string;
  kind: "error" | "success";
};

type ToastViewportProps = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-96"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), 5000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={clsx(
        "pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-[0_12px_30px_rgba(31,91,77,0.16)]",
        toast.kind === "error"
          ? "border-(--coral)/35 text-[#9a432c]"
          : "border-(--green)/30 text-(--green)",
      )}
    >
      <span className="flex-1 leading-5">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="cursor-pointer text-lg leading-4 text-(--muted) hover:text-(--ink)"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}