import { NextResponse } from "next/server";
import { toFile } from "openai/uploads";
import { getOpenAI } from "@/lib/openai";
import {
  deleteOpenAIResources,
  indexAndClassifyPolicy,
} from "@/lib/server/document-processing";
import { validatePdf } from "@/lib/validation";

export const maxDuration = 60;

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
        file: { id: uploadedFile.id, name: file.name, size: file.size },
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
