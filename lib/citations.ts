export type Citation = {
  fileId: string;
  filename?: string;
  documentName?: string;
  index?: number;
};

export function extractCitations(response: unknown): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();
  function visit(value: unknown) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const item = value as Record<string, unknown>;
    if (item.type === "file_citation" && typeof item.file_id === "string") {
      const citation = {
        fileId: item.file_id,
        ...(typeof item.filename === "string"
          ? { filename: item.filename }
          : {}),
        ...(typeof item.index === "number" ? { index: item.index } : {}),
      };
      const key = `${citation.fileId}:${citation.index ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        citations.push(citation);
      }
    }
    Object.values(item).forEach(visit);
  }
  visit(response);
  return citations;
}
