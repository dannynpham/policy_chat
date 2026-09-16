import type { PolicyDocument } from "@/lib/documents";

type UploadResponse = {
  vectorStoreId: string;
  file: { id: string; name: string; size: number; contentHash: string };
};

async function readResponse(response: Response): Promise<UploadResponse> {
  const data = (await response.json()) as UploadResponse & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "The document request failed.");
  return data;
}

export async function uploadPolicy(
  file: File,
  existingFileIds: string[] = [],
): Promise<PolicyDocument> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("existingFileIds", JSON.stringify(existingFileIds));
  const data = await readResponse(
    await fetch("/api/documents", { method: "POST", body: formData }),
  );
  return {
    id: data.vectorStoreId,
    fileId: data.file.id,
    name: data.file.name,
    size: data.file.size,
    contentHash: data.file.contentHash,
  };
}

export async function downloadPolicy(
  policyDocument: PolicyDocument,
): Promise<void> {
  const params = new URLSearchParams({
    fileId: policyDocument.fileId,
    filename: policyDocument.name,
  });
  const link = document.createElement("a");
  link.href = `/api/documents?${params.toString()}`;
  link.download = policyDocument.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function deletePolicies(
  documents: PolicyDocument[],
): Promise<void> {
  const response = await fetch("/api/documents", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documents }),
  });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "The documents could not be removed.");
  }
}
