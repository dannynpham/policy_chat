export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validatePdf(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File)) return "Please upload a PDF file.";
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  )
    return "Only PDF files are supported.";
  if (file.size > MAX_FILE_SIZE) return "The PDF must be 10 MB or smaller.";
  if (file.size === 0) return "The PDF cannot be empty.";
  return null;
}

export function validateQuestion(
  input: unknown,
): { vectorStoreIds: string[]; question: string } | string {
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
  return { vectorStoreIds, question: body.question.trim() };
}
