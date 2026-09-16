"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  FileButton,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconFileUpload, IconTrash } from "@tabler/icons-react";
import { DocumentStatus } from "@/hooks/usePolicyDocuments";
import { downloadPolicy } from "@/lib/api/documents";
import type { PolicyDocument } from "@/lib/documents";

const DOCUMENT_OPERATION_NOTIFICATION_ID = "policychat-document-operation";

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
  onNotify: (message: string, kind?: "error" | "success") => void;
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
  onNotify,
  hasQuestion,
  onSuggestion,
}: PolicySidebarProps) {
  const isBusy = status !== DocumentStatus.IDLE;
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (error) onNotify(error);
  }, [error, onNotify]);

  useEffect(() => {
    if (downloadError) onNotify(downloadError);
  }, [downloadError, onNotify]);

  useEffect(() => {
    const messages: Record<DocumentStatus, string> = {
      [DocumentStatus.IDLE]: "",
      [DocumentStatus.UPLOADING]: "Checking and indexing policy...",
      [DocumentStatus.DELETING]: "Removing policy...",
      [DocumentStatus.CLEARING]: "Removing all policies...",
    };
    const message = messages[status];
    if (message) {
      notifications.show({
        id: DOCUMENT_OPERATION_NOTIFICATION_ID,
        message,
        loading: true,
        autoClose: false,
        withCloseButton: false,
      });
    } else {
      notifications.hide(DOCUMENT_OPERATION_NOTIFICATION_ID);
    }
    return () => {
      notifications.hide(DOCUMENT_OPERATION_NOTIFICATION_ID);
    };
  }, [status]);

  async function handleDownload(policy: PolicyDocument) {
    setDownloadError("");
    setDownloadingFileId(policy.fileId);
    try {
      await downloadPolicy(policy);
    } catch (downloadError) {
      setDownloadError(
        downloadError instanceof Error
          ? downloadError.message
          : "The policy could not be downloaded.",
      );
    } finally {
      setDownloadingFileId(null);
    }
  }

  return (
    <Stack gap="lg">
      <Paper withBorder radius="md" p="lg" shadow="sm">
        <Stack gap="md">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts="1.5px">
            01 / Upload a policy
          </Text>
          <FileButton
            onChange={(file) => file && onUpload(file)}
            accept="application/pdf,.pdf"
            disabled={isBusy}
          >
            {(props) => (
              <Button
                {...props}
                variant="light"
                size="lg"
                leftSection={<IconFileUpload size={20} />}
                fullWidth
              >
                Choose a PDF
              </Button>
            )}
          </FileButton>
          <Text size="xs" c="dimmed" ta="center">
            PDF files up to 4 MB
          </Text>
        </Stack>
        {documents.length > 0 && (
          <>
            <Divider my="lg" />
            <Group justify="space-between" mb="sm">
              <Text size="xs" tt="uppercase" c="dimmed" lts="1px">
                Included policies · {documents.length}
              </Text>
              <Button
                variant="subtle"
                color="red"
                size="compact-xs"
                onClick={onReset}
                disabled={isBusy || downloadingFileId !== null}
              >
                Clear all
              </Button>
            </Group>
            <Stack gap="xs">
              {documents.map((policy) => (
                <Paper key={policy.id} withBorder p="xs" radius="sm">
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} truncate flex={1}>
                      {policy.name}
                    </Text>
                    <Badge size="xs" variant="light" color="teal">
                      Indexed
                    </Badge>
                    <ActionIcon
                      variant="subtle"
                      color="teal"
                      aria-label={`Download ${policy.name}`}
                      title={`Download ${policy.name}`}
                      onClick={() => handleDownload(policy)}
                      disabled={isBusy || downloadingFileId !== null}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Remove ${policy.name}`}
                      onClick={() => onRemove(policy)}
                      disabled={isBusy || downloadingFileId !== null}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
            <Text mt="sm" size="xs" c="teal">
              All uploaded policies are included in answers.
            </Text>
          </>
        )}
      </Paper>
      <Stack gap="xs">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts="1.5px">
          Try asking
        </Text>
        {SUGGESTIONS.map((suggestion) => (
          <UnstyledButton
            key={suggestion}
            disabled={!hasQuestion}
            onClick={() => onSuggestion(suggestion)}
          >
            <Group
              justify="space-between"
              px="sm"
              py="xs"
              style={{ borderRadius: "var(--mantine-radius-sm)" }}
            >
              <Text size="sm" c={hasQuestion ? "dark" : "dimmed"}>
                {suggestion}
              </Text>
              <Text c="teal">↗</Text>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Stack>
  );
}
