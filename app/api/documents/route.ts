import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { toFile } from "openai/uploads";
import { getOpenAI } from "@/lib/openai";
import {
  deleteOpenAIResources,
  indexAndClassifyPolicy,
} from "@/lib/server/document-processing";
import { validatePdf } from "@/lib/validation";

export const maxDuration = 60;

function safeDownloadName(value: string | null): string {
  const name = (value ?? "policy.pdf")
    .replace(/[\r\n"\\/]/g, "_")
    .trim();
  if (!name) return "policy.pdf";
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId");
    if (!fileId)
      return NextResponse.json({ error: "A file ID is required." }, { status: 400 });
    const openai = getOpenAI();
    const file = await openai.files.content(fileId);
    return new Response(await file.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeDownloadName(url.searchParams.get("filename"))}"`,
      },
    });
  } catch (error) {
    console.error(
      "Policy download failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { error: "The policy could not be downloaded." },
      { status: 404 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const openai = getOpenAI();
    const formData = await request.formData();
    const file = formData.get("file");
    const validationError = validatePdf(file);
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "Please upload a PDF file." },
        { status: 400 },
      );
    const contentHash = createHash("sha256")
      .update(Buffer.from(await file.arrayBuffer()))
      .digest("hex");
    const uploadedFile = await openai.files.create({
      file: await toFile(await file.arrayBuffer(), file.name, {
        type: "application/pdf",
      }),
      purpose: "assistants",
    });
    let vectorStoreId: string | undefined;
    try {
      const vectorStore = await openai.vectorStores.create({
        name: `PolicyChat - ${file.name}`,
      });
      vectorStoreId = vectorStore.id;
      const isPolicy = await indexAndClassifyPolicy(
        openai,
        vectorStore.id,
        uploadedFile.id,
      );
      if (!isPolicy) {
        await deleteOpenAIResources(openai, {
          vectorStoreId,
          fileId: uploadedFile.id,
        });
        return NextResponse.json(
          {
            error:
              "This file does not appear to be an insurance policy. Please upload an insurance policy PDF.",
          },
          { status: 422 },
        );
      }
      return NextResponse.json({
        vectorStoreId,
        file: {
          id: uploadedFile.id,
          name: file.name,
          size: file.size,
          contentHash,
        },
      });
    } catch (error) {
      await deleteOpenAIResources(openai, {
        vectorStoreId,
        fileId: uploadedFile.id,
      });
      throw error;
    }
  } catch (error) {
    console.error(
      "Document upload failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { error: "The document could not be uploaded or indexed." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const openai = getOpenAI();
    const body = (await request.json().catch(() => ({}))) as {
      documents?: unknown;
      vectorStoreId?: unknown;
      fileId?: unknown;
    };
    const documents: Array<{ id?: unknown; fileId?: unknown }> = Array.isArray(
      body.documents,
    )
      ? body.documents
      : [];
    if (
      documents.length === 0 &&
      typeof body.vectorStoreId === "string" &&
      body.vectorStoreId
    ) {
      documents.push({ id: body.vectorStoreId, fileId: body.fileId });
    }
    await Promise.all(
      documents.map((document) =>
        deleteOpenAIResources(openai, {
          vectorStoreId:
            typeof document?.id === "string" ? document.id : undefined,
          fileId:
            typeof document?.fileId === "string" ? document.fileId : undefined,
        }),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Cleanup could not be completed." },
      { status: 500 },
    );
  }
}
