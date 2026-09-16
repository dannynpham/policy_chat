"use client";

import { useEffect, useRef, type RefObject, type SubmitEvent } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowRight,
  IconRobot,
  IconUser,
} from "@tabler/icons-react";
import { ChatStatus } from "@/hooks/usePolicyChat";
import type { Message } from "@/lib/chat";

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
  onNotify: (message: string, kind?: "error" | "success") => void;
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
  onNotify,
  hasUploads,
}: ChatPanelProps) {
  const questionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === ChatStatus.IDLE && messages.length > 0)
      questionInputRef.current?.focus();
  }, [messages.length, status]);

  useEffect(() => {
    if (error) onNotify(error);
  }, [error, onNotify]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Paper withBorder radius="md" p={{ base: "md", sm: "xl" }} shadow="sm" h="100%">
      <Stack h="100%" gap="md">
        <Group justify="space-between" align="start">
          <Box>
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts="1.5px">
              02 / Ask your policy
            </Text>
            <Title order={2} size="h2" mt={4}>Conversation</Title>
            {status === ChatStatus.ASKING && (
              <Group gap="xs" mt="xs" role="status" aria-live="polite">
                <Loader size="xs" />
                <Text size="xs" c="dimmed">Generating answer...</Text>
              </Group>
            )}
          </Box>
          <Button
            variant="subtle"
            size="sm"
            onClick={onNewConversation}
            disabled={messages.length === 0}
          >
            New conversation
          </Button>
        </Group>
        <Divider />
        <ScrollArea.Autosize mah={560} offsetScrollbars type="auto" flex={1}>
          <Stack gap="lg" pr="sm">
            {messages.length === 0 && (
              <Box mih={288} style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
                <Text maw={380} size="lg" lh={1.6} c="dimmed">
                  {hasUploads
                    ? "Your policies are indexed. Start with a question below."
                    : "Upload insurance policies to start a conversation."}
                </Text>
              </Box>
            )}
            {messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                ml={message.role === "user" ? "xl" : 0}
                mr={message.role !== "user" ? "xl" : 0}
              >
                <Group justify={message.role === "user" ? "end" : "start"} gap="xs" mb={4}>
                  {message.role === "assistant" && <IconRobot size={15} color="var(--mantine-color-teal-7)" />}
                  <Text size="xs" c="dimmed">{message.role === "user" ? "You" : "PolicyChat"}</Text>
                  {message.role === "user" && <IconUser size={15} color="var(--mantine-color-gray-6)" />}
                </Group>
                <Paper
                  withBorder={message.role === "assistant"}
                  bg={message.role === "user" ? "teal.0" : "gray.0"}
                  p="md"
                  radius="md"
                >
                  <Text style={{ whiteSpace: "pre-wrap" }} lh={1.7}>{message.content}</Text>
                  {message.citations && message.citations.length > 0 && (
                    <Group gap="xs" mt="md">
                      {message.citations.map((citation) => (
                        <Badge key={`${citation.fileId}-${citation.index ?? "x"}`} variant="outline" color="gray">
                          {citation.documentName ?? citation.filename ?? citation.fileId}
                          {citation.filename && citation.documentName && ` · ${citation.filename}`}
                        </Badge>
                      ))}
                    </Group>
                  )}
                  {message.needsHumanReview && (
                    <Alert
                      mt="md"
                      color="orange"
                      variant="light"
                      icon={<IconAlertCircle size={18} />}
                      title="This answer needs human review."
                    >
                      <Text size="sm">
                        {message.reason === "blocked_term"
                          ? "This request was stopped before it reached the policy assistant."
                          : "I could not find enough evidence in the uploaded policies."}
                      </Text>
                      {!liveAgentRequested ? (
                        <Button mt="sm" size="xs" color="orange" variant="outline" onClick={onRequestLiveAgent}>
                          Loop to live agent
                        </Button>
                      ) : (
                        <Text mt="sm" size="sm" fw={700} c="teal">
                          Live-agent handoff simulated. A human queue would receive this conversation.
                        </Text>
                      )}
                    </Alert>
                  )}
                </Paper>
              </Box>
            ))}
            <div ref={chatEndRef} aria-hidden="true" />
          </Stack>
        </ScrollArea.Autosize>
        <form onSubmit={handleSubmit}>
          <Group wrap="nowrap" align="end">
            <TextInput
              flex={1}
              ref={questionInputRef}
              value={question}
              onChange={(event) => onQuestionChange(event.currentTarget.value)}
              disabled={!hasUploads || status === ChatStatus.ASKING}
              aria-label="Ask a question about your policy"
              placeholder={hasUploads ? "Ask about your policy..." : "Upload a policy first"}
            />
            <Button
              type="submit"
              disabled={!hasUploads || !question.trim() || status === ChatStatus.ASKING}
            >
              {status === ChatStatus.ASKING ? (
                <Group gap="xs"><Loader size="xs" color="white" /> Thinking</Group>
              ) : (
                <Group gap="xs">Ask <IconArrowRight size={16} /></Group>
              )}
            </Button>
          </Group>
        </form>
      </Stack>
    </Paper>
  );
}
