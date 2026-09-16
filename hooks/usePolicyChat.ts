"use client";

import { useEffect, useRef, useState } from "react";
import { askPolicy, createAssistantMessage } from "@/lib/api/chat";
import type { ConversationMessage, Message } from "@/lib/chat";
import type { PolicyDocument } from "@/lib/documents";

export enum ChatStatus {
  IDLE = "IDLE",
  ASKING = "ASKING",
}

export function usePolicyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState(ChatStatus.IDLE);
  const [error, setError] = useState("");
  const [liveAgentRequested, setLiveAgentRequested] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function submitQuestion(documents: PolicyDocument[]) {
    const trimmedQuestion = question.trim();
    if (
      !trimmedQuestion ||
      documents.length === 0 ||
      status === ChatStatus.ASKING
    )
      return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setQuestion("");
    setError("");
    const conversation: ConversationMessage[] = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: "user", content: trimmedQuestion },
    ];
    setMessages((current) => [
      ...current,
      { role: "user", content: trimmedQuestion },
    ]);
    setStatus(ChatStatus.ASKING);
    try {
      const data = await askPolicy(
        documents.map((document) => document.id),
        trimmedQuestion,
        conversation,
        controller.signal,
      );
      setMessages((current) => [
        ...current,
        createAssistantMessage(data, documents),
      ]);
    } catch (chatError) {
      if (chatError instanceof DOMException && chatError.name === "AbortError")
        return;
      setError(
        chatError instanceof Error
          ? chatError.message
          : "Could not answer that question.",
      );
    } finally {
      if (requestControllerRef.current === controller)
        requestControllerRef.current = null;
      setStatus(ChatStatus.IDLE);
    }
  }

  function resetConversation() {
    requestControllerRef.current?.abort();
    setMessages([]);
    setQuestion("");
    setError("");
    setStatus(ChatStatus.IDLE);
    setLiveAgentRequested(false);
  }

  return {
    messages,
    question,
    setQuestion,
    status,
    error,
    liveAgentRequested,
    requestLiveAgent: () => setLiveAgentRequested(true),
    submitQuestion,
    resetConversation,
    chatEndRef,
  };
}
