"use client";

import type { SubmitEvent } from "react";
import clsx from "clsx";
import type { PolicyDocument } from "@/lib/documents";
import { DocumentStatus } from "@/hooks/usePolicyDocuments";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const SUGGESTIONS = [
  "What is the deductible?",
  "What exclusions apply?",
  "What are the coverage limits?",
  "Does this policy cover water damage?",
];

type PolicySidebarProps = {
  documents: PolicyDocument[];
  status: DocumentStatus;
  error: string;
  onUpload: (file: File) => void;
  onRemove: (document: PolicyDocument) => void;
  onReset: () => void;
  hasQuestion: boolean;
  onSuggestion: (suggestion: string) => void;
};

export function PolicySidebar({
  documents,
  status,
  error,
  onUpload,
  onRemove,
  onReset,
  hasQuestion,
  onSuggestion,
}: PolicySidebarProps) {
  const isBusy = status !== DocumentStatus.IDLE;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      "document",
    ) as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onUpload(file);
    event.currentTarget.reset();
  }

  return (
    <aside>
      <div className="rounded-lg border border-(--line) bg-(--panel) p-6 shadow-[0_12px_32px_rgba(31,91,77,0.06)] backdrop-blur-sm">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-(--muted)">
          01 / Upload a policy
        </p>
        <form onSubmit={handleSubmit}>
          <label
            className={clsx(
              "flex min-h-44 flex-col items-center justify-center rounded-md border-2 border-dashed border-(--green)/35 bg-(--mint)/45 p-5 text-center transition",
              {
                "cursor-not-allowed opacity-60": isBusy,
                "cursor-pointer hover:border-(--green) hover:bg-(--mint)":
                  !isBusy,
              },
            )}
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl text-(--green) shadow-sm">
              ↑
            </span>
            <span className="font-bold">Choose a PDF</span>
            <span className="mt-1 text-xs text-(--muted)">10 MB maximum</span>
            <input
              className="sr-only"
              type="file"
              name="document"
              accept="application/pdf,.pdf"
              disabled={isBusy}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            />
          </label>
        </form>
        {status === DocumentStatus.UPLOADING && (
          <p className="mt-4 flex items-center gap-2 text-sm text-(--green)">
            <LoadingSpinner label="Checking and indexing policy" />
            Uploading, checking, and indexing policy...
          </p>
        )}
        {status === DocumentStatus.DELETING && (
          <p className="mt-4 flex items-center gap-2 text-sm text-(--coral)">
            <LoadingSpinner label="Removing policy" />
            Removing policy...
          </p>
        )}
        {status === DocumentStatus.CLEARING && (
          <p className="mt-4 flex items-center gap-2 text-sm text-(--coral)">
            <LoadingSpinner label="Removing all policies" />
            Removing all policies...
          </p>
        )}
        {error && (
          <p className="mt-4 border-l-2 border-(--coral) bg-[#fff4ef] p-3 text-sm text-[#9a432c]">
            {error}
          </p>
        )}
        {documents.length > 0 && (
          <div className="mt-5 border-t border-(--line) pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-(--muted)">
                Included policies · {documents.length}
              </p>
              <button
                className={clsx(
                  "text-xs font-bold text-(--coral) underline",
                  "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                )}
                onClick={onReset}
                disabled={isBusy}
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-2 rounded-md border border-(--line) bg-(--mint)/45 p-3 transition hover:border-(--green)/40 hover:bg-(--mint)/70"
                >
                  <p className="min-w-0 flex-1 truncate text-left text-sm font-bold">
                    {document.name}
                  </p>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-(--green)">
                    Indexed
                  </span>
                  <button
                    aria-label={`Remove ${document.name}`}
                    className={clsx(
                      "px-1 text-(--coral)",
                      "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                    )}
                    onClick={() => onRemove(document)}
                    disabled={isBusy}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-(--green)">
              All uploaded policies are included in answers.
            </p>
          </div>
        )}
      </div>
      <div className="mt-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-(--muted)">
          Try asking
        </p>
        <div className="space-y-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              disabled={!hasQuestion}
              onClick={() => onSuggestion(suggestion)}
              className="block w-full cursor-pointer rounded-md border border-transparent px-3 py-2.5 text-left text-sm transition hover:border-(--line) hover:bg-white/70 hover:text-(--green) disabled:cursor-not-allowed disabled:opacity-40"
            >
              {suggestion} <span className="float-right">↗</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
