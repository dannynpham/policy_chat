export const MAX_FILE_SIZE = 4 * 1024 * 1024;
export const MAX_CONVERSATION_MESSAGES = 10;
export const MAX_MESSAGE_LENGTH = 4000;

export function validatePdf(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File)) return "Please upload a PDF file.";
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  )
    return "Only PDF files are supported.";
  if (file.size > MAX_FILE_SIZE) return "The PDF must be 4 MB or smaller.";
  if (file.size === 0) return "The PDF cannot be empty.";
  return null;
}

export function validateQuestion(input: unknown):
  | {
      vectorStoreIds: string[];
      question: string;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    }
  | string {
  if (!input || typeof input !== "object") return "Request body must be JSON.";
  const body = input as Record<string, unknown>;
  const vectorStoreIds = Array.isArray(body.vectorStoreIds)
    ? body.vectorStoreIds
        .filter(
          (id): id is string => typeof id === "string" && Boolean(id.trim()),
        )
        .map((id) => id.trim())
    : typeof body.vectorStoreId === "string" && body.vectorStoreId.trim()
      ? [body.vectorStoreId.trim()]
      : [];
  if (vectorStoreIds.length === 0)
    return "At least one vector store ID is required.";
  if (typeof body.question !== "string" || !body.question.trim())
    return "Please ask a question.";
  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > MAX_CONVERSATION_MESSAGES
  )
    return `Conversation history must contain 1-${MAX_CONVERSATION_MESSAGES} messages.`;
  const messages = body.messages.map((message) => {
    if (!message || typeof message !== "object") return null;
    const item = message as Record<string, unknown>;
    if (
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      !item.content.trim() ||
      item.content.length > MAX_MESSAGE_LENGTH
    )
      return null;
    return {
      role: item.role,
      content: item.content.trim(),
    } as { role: "user" | "assistant"; content: string };
  });
  if (messages.some((message) => message === null))
    return `Each conversation message must have a user or assistant role and 1-${MAX_MESSAGE_LENGTH} characters.`;
  const validMessages = messages.filter(
    (message): message is { role: "user" | "assistant"; content: string } =>
      message !== null,
  );
  const question = body.question.trim();
  const latestMessage = validMessages[validMessages.length - 1];
  if (latestMessage?.role !== "user" || latestMessage.content !== question)
    return "The latest conversation message must contain the current question.";
  return { vectorStoreIds, question, messages: validMessages };
}
