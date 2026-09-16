"use client";

import { startTransition, useEffect, useState } from "react";
import { deletePolicies, uploadPolicy } from "@/lib/api/documents";
import { hashFile, type PolicyDocument } from "@/lib/documents";

const STORAGE_KEY = "policychat_documents";

export enum DocumentStatus {
  IDLE = "IDLE",
  UPLOADING = "UPLOADING",
  DELETING = "DELETING",
  CLEARING = "CLEARING",
}

export function usePolicyDocuments(onDocumentsChanged: () => void) {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [status, setStatus] = useState(DocumentStatus.IDLE);
  const [error, setError] = useState("");

  useEffect(() => {
    startTransition(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as PolicyDocument[];
        if (Array.isArray(parsed)) setDocuments(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  async function uploadDocument(file: File) {
    setError("");
    setStatus(DocumentStatus.UPLOADING);
    try {
      const contentHash = await hashFile(file);
      if (
        documents.some((document) => document.contentHash === contentHash)
      ) {
        throw new Error("This policy PDF has already been uploaded.");
      }
      const nextDocument = await uploadPolicy(file);
      setDocuments((current) => {
        const nextDocuments = [
          ...current.filter(
            (document) => document.fileId !== nextDocument.fileId,
          ),
          nextDocument,
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDocuments));
        return nextDocuments;
      });
      onDocumentsChanged();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setStatus(DocumentStatus.IDLE);
    }
  }

  async function removeDocument(document: PolicyDocument) {
    setError("");
    setStatus(DocumentStatus.DELETING);
    try {
      await deletePolicies([document]);
      setDocuments((current) => {
        const nextDocuments = current.filter((item) => item.id !== document.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDocuments));
        return nextDocuments;
      });
      onDocumentsChanged();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The document could not be removed.",
      );
    } finally {
      setStatus(DocumentStatus.IDLE);
    }
  }

  async function resetSession() {
    setError("");
    setStatus(DocumentStatus.CLEARING);
    try {
      await deletePolicies(documents);
      setDocuments([]);
      localStorage.removeItem(STORAGE_KEY);
      onDocumentsChanged();
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "The documents could not be removed.",
      );
    } finally {
      setStatus(DocumentStatus.IDLE);
    }
  }

  return {
    documents,
    status,
    error,
    uploadDocument,
    removeDocument,
    resetSession,
  };
}
