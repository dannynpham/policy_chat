"use client";

import { ChatPanel } from "@/components/ChatPanel";
import { PolicySidebar } from "@/components/PolicySidebar";
import { ChatStatus, usePolicyChat } from "@/hooks/usePolicyChat";
import { usePolicyDocuments } from "@/hooks/usePolicyDocuments";

export default function Home() {
  const chat = usePolicyChat();
  const documents = usePolicyDocuments(chat.resetConversation);
  const hasUploads = documents.documents.length > 0;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-end justify-between gap-6 border-b border-(--line) pb-7">
          <div>
            <h1 className="text-5xl leading-none tracking-tight sm:text-7xl">
              Policy<span className="text-(--green)">Chat</span>
            </h1>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-6 text-(--muted) sm:block">
            Ask plain-language questions. Get answers about your policies.
          </p>
        </header>
        <div className="grid gap-10 lg:grid-cols-[minmax(260px,0.7fr)_1.3fr]">
          <PolicySidebar
            documents={documents.documents}
            status={documents.status}
            error={documents.error}
            onUpload={documents.uploadDocument}
            onRemove={documents.removeDocument}
            onReset={documents.resetSession}
            hasQuestion={hasUploads && chat.status !== ChatStatus.ASKING}
            onSuggestion={chat.setQuestion}
          />
          <ChatPanel
            messages={chat.messages}
            question={chat.question}
            status={chat.status}
            error={chat.error}
            liveAgentRequested={chat.liveAgentRequested}
            chatEndRef={chat.chatEndRef}
            onQuestionChange={chat.setQuestion}
            onSubmit={() =>
              chat.submitQuestion(documents.documents)
            }
            onNewConversation={chat.resetConversation}
            onRequestLiveAgent={chat.requestLiveAgent}
            hasUploads={hasUploads}
          />
        </div>
      </div>
    </main>
  );
}
