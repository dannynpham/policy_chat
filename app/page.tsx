"use client";

import { Container, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useCallback } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { PolicySidebar } from "@/components/PolicySidebar";
import { ChatStatus, usePolicyChat } from "@/hooks/usePolicyChat";
import { usePolicyDocuments } from "@/hooks/usePolicyDocuments";

export default function Home() {
  const chat = usePolicyChat();
  const documents = usePolicyDocuments(chat.resetConversation);
  const hasUploads = documents.documents.length > 0;
  const notify = useCallback(
    (message: string, kind: "error" | "success" = "error") => {
      notifications.show({
        message,
        color: kind === "error" ? "red" : "teal",
      });
    },
    [],
  );

  return (
    <Container size="xl" py={{ base: "xl", lg: 48 }}>
      <Stack gap="xl">
        <Group
          justify="space-between"
          align="end"
          pb="lg"
          style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
        >
          <Title order={1} size="clamp(2.75rem, 8vw, 5rem)" lh={1}>
            Policy
            <span style={{ color: "var(--mantine-color-teal-8)" }}>Chat</span>
          </Title>
          <Text c="dimmed" ta="right" maw={280} visibleFrom="sm">
            Ask plain-language questions. Get answers about your policies.
          </Text>
        </Group>
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <PolicySidebar
              documents={documents.documents}
              status={documents.status}
              error={documents.error}
              onUpload={documents.uploadDocument}
              onRemove={documents.removeDocument}
              onReset={documents.resetSession}
              onNotify={notify}
              hasQuestion={hasUploads && chat.status !== ChatStatus.ASKING}
              onSuggestion={chat.setQuestion}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <ChatPanel
              messages={chat.messages}
              question={chat.question}
              status={chat.status}
              error={chat.error}
              liveAgentRequested={chat.liveAgentRequested}
              chatEndRef={chat.chatEndRef}
              onQuestionChange={chat.setQuestion}
              onSubmit={() => chat.submitQuestion(documents.documents)}
              onNewConversation={chat.resetConversation}
              onRequestLiveAgent={chat.requestLiveAgent}
              onNotify={notify}
              hasUploads={hasUploads}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
