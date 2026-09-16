import type { ConversationMessage, Message } from "@/lib/chat";
import type { Citation } from "@/lib/citations";
import type { PolicyDocument } from "@/lib/documents";

export type ChatResponse = {
  answer: string;
  citations: Citation[];
  needsHumanReview: boolean;
  blocked?: boolean;
  reason?: "blocked_term" | "insufficient_evidence";
};

export async function askPolicy(
  vectorStoreIds: string[],
  question: string,
  messages: ConversationMessage[],
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vectorStoreIds, question, messages }),
    signal,
  });
  const data = (await response.json()) as ChatResponse & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "Could not answer that question.");
  return data;
}

export function createAssistantMessage(
  data: ChatResponse,
  documents: PolicyDocument[],
): Message {
  const documentNames = new Map(
    documents.map((document) => [document.fileId, document.name]),
  );
  return {
    role: "assistant",
    content: data.answer,
    citations: data.citations.map((citation) => ({
      ...citation,
      documentName: documentNames.get(citation.fileId),
    })),
    needsHumanReview: data.needsHumanReview,
    reason: data.reason,
  };
}
