import type OpenAI from "openai";
import { isInsurancePolicyClassification } from "@/lib/policy-classification";

const POLICY_CLASSIFICATION_INSTRUCTIONS =
  "Classify the uploaded document using only its retrieved content. Respond with exactly YES if it is an insurance policy or insurance policy document, including homeowners, renters, auto, collectibles, or other property coverage. Respond with exactly NO for every other document. Do not explain your answer.";

export type OpenAIDocumentResources = {
  vectorStoreId?: string;
  fileId?: string;
};

export async function indexAndClassifyPolicy(
  openai: OpenAI,
  vectorStoreId: string,
  fileId: string,
): Promise<boolean> {
  const vectorStoreFile = await openai.vectorStores.files.createAndPoll(
    vectorStoreId,
    { file_id: fileId },
  );
  if (vectorStoreFile.status !== "completed") {
    throw new Error(
      vectorStoreFile.last_error?.message ??
        "The policy could not be indexed.",
    );
  }

  const classification = await openai.responses.create({
    model: "gpt-4.1-mini",
    instructions: POLICY_CLASSIFICATION_INSTRUCTIONS,
    input: "Is the uploaded document an insurance policy?",
    tools: [{ type: "file_search", vector_store_ids: [vectorStoreId] }],
  });
  return isInsurancePolicyClassification(classification.output_text);
}

export async function deleteOpenAIResources(
  openai: OpenAI,
  resources: OpenAIDocumentResources,
): Promise<void> {
  await Promise.allSettled([
    resources.vectorStoreId
      ? openai.vectorStores.delete(resources.vectorStoreId)
      : Promise.resolve(),
    resources.fileId
      ? openai.files.delete(resources.fileId)
      : Promise.resolve(),
  ]);
}