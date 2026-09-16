"use client";

import type { RefObject, SubmitEvent } from "react";
import clsx from "clsx";
import type { Message } from "@/lib/chat";
import { ChatStatus } from "@/hooks/usePolicyChat";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type ChatPanelProps = {
  messages: Message[];
  question: string;
  status: ChatStatus;
  error: string;
  liveAgentRequested: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onQuestionChange: (question: string) => void;
  onSubmit: () => void;
  onNewConversation: () => void;
  onRequestLiveAgent: () => void;
  hasUploads: boolean;
};

export function ChatPanel({
  messages,
  question,
  status,
  error,
  liveAgentRequested,
  chatEndRef,
  onQuestionChange,
  onSubmit,
  onNewConversation,
  onRequestLiveAgent,
  hasUploads,
}: ChatPanelProps) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="flex min-h-140 flex-col rounded-lg border border-(--line) bg-(--panel) p-5 shadow-[0_16px_40px_rgba(31,91,77,0.08)] backdrop-blur-sm sm:p-8">
      <div className="mb-7 flex items-center justify-between border-b border-(--line) pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-(--muted)">
            02 / Ask your policy
          </p>
          <h2 className="mt-1 text-2xl">Conversation</h2>
          {status === ChatStatus.ASKING && (
            <p className="mt-2 flex items-center gap-2 text-xs text-(--muted)">
              <LoadingSpinner label="Generating answer" />
              Generating answer...
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onNewConversation}
          disabled={messages.length === 0}
          className="cursor-pointer rounded-md border border-(--line) px-3 py-2 text-xs font-bold text-(--muted) transition hover:border-(--green) hover:text-(--green) disabled:cursor-not-allowed disabled:opacity-40"
        >
          New conversation
        </button>
      </div>
      <div className="min-h-0 max-h-140 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-2 pb-6 [scrollbar-color:var(--green)_var(--mint)] scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex h-full min-h-72 items-center justify-center text-center">
            <p className="max-w-sm text-lg leading-8 text-(--muted)">
              {hasUploads
                ? "Your policies are indexed. Start with a question below."
                : "Upload insurance policies to start a conversation."}
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={clsx({
              "ml-8": message.role === "user",
              "mr-8": message.role !== "user",
            })}
          >
            <p
              className={clsx(
                "mb-1 text-xs tracking-wider text-(--muted)",
                message.role === "user" && "text-right",
              )}
            >
              {message.role === "user" ? "You" : "PolicyChat"}
            </p>
            <div
              className={clsx(
                "rounded-lg p-4 shadow-sm",
                message.role === "user"
                  ? "bg-(--mint)"
                  : "border border-(--line) bg-white/65 pl-5",
              )}
            >
              <p className="whitespace-pre-wrap leading-7">{message.content}</p>
              {message.citations && message.citations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {message.citations.map((citation) => (
                    <span
                      key={`${citation.fileId}-${citation.index ?? "x"}`}
                      className="border border-(--line) px-2 py-1 text-xs text-(--muted)"
                    >
                      {citation.documentName ??
                        citation.filename ??
                        citation.fileId}
                      {citation.filename &&
                        citation.documentName &&
                        ` · ${citation.filename}`}
                    </span>
                  ))}
                </div>
              )}
              {message.needsHumanReview && (
                <div className="mt-4 rounded-md border border-(--coral)/25 bg-[#fff8f4] p-4 text-sm">
                  <p className="font-bold text-(--coral)">
                    This answer needs human review.
                  </p>
                  <p className="mt-1 text-(--muted)">
                    {message.reason === "blocked_term"
                      ? "This request was stopped before it reached the policy assistant."
                      : "I could not find enough evidence in the uploaded policies."}
                  </p>
                  {!liveAgentRequested ? (
                    <button
                      type="button"
                      onClick={onRequestLiveAgent}
                      className="mt-3 cursor-pointer rounded-md border border-(--coral) px-3 py-2 text-xs font-bold text-(--coral) transition hover:bg-(--coral) hover:text-white"
                    >
                      Loop to live agent
                    </button>
                  ) : (
                    <p className="mt-3 font-bold text-(--green)">
                      Live-agent handoff simulated. A human queue would receive
                      this conversation.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} aria-hidden="true" />
      </div>
      {error && (
        <p className="mb-4 border-l-2 border-(--coral) bg-[#fff4ef] p-3 text-sm text-[#9a432c]">
          {error}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex gap-3 rounded-lg border-2 border-(--green)/35 bg-white px-3 py-2 shadow-[0_5px_0_var(--mint)] transition focus-within:border-(--green) focus-within:shadow-[0_5px_0_var(--green)]"
      >
        <input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          disabled={!hasUploads || status === ChatStatus.ASKING}
          placeholder={
            hasUploads ? "Ask about your policy..." : "Upload a policy first"
          }
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-(--muted) disabled:cursor-not-allowed"
        />
        <button
          disabled={
            !hasUploads || !question.trim() || status === ChatStatus.ASKING
          }
          className="rounded-md bg-(--green) px-5 py-3 text-sm font-bold text-white transition hover:bg-(--green-dark) disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
        >
          {status === ChatStatus.ASKING ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner label="Sending question" />
              Thinking
            </span>
          ) : (
            "Ask"
          )}
        </button>
      </form>
    </section>
  );
}
