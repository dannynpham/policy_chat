import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { extractCitations } from "@/lib/citations";
import { containsHumanReviewTerm, shouldEscalate } from "@/lib/escalation";
import { validateQuestion } from "@/lib/validation";

const INSTRUCTIONS =
  "You answer questions using only the retrieved content from the uploaded policies. Do not rely on general insurance knowledge. If the policies do not provide enough evidence, say that you could not find the answer in the uploaded documents. Keep answers concise and include the available source citations.";

export async function POST(request: Request) {
  try {
    const validated = validateQuestion(await request.json().catch(() => null));
    if (typeof validated === "string")
      return NextResponse.json({ error: validated }, { status: 400 });
    if (containsHumanReviewTerm(validated.question)) {
      return NextResponse.json({
        answer:
          "This request requires review by a human agent. It was not sent to the policy assistant.",
        citations: [],
        needsHumanReview: true,
        blocked: true,
        reason: "blocked_term",
      });
    }
    const openai = getOpenAI();
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: INSTRUCTIONS,
      input: validated.question,
      tools: [
        { type: "file_search", vector_store_ids: validated.vectorStoreIds },
      ],
      include: ["file_search_call.results"],
    });
    const answer =
      response.output_text ||
      "I could not find the answer in the uploaded documents.";
    const citations = extractCitations(response);
    return NextResponse.json({
      answer,
      citations,
      needsHumanReview: shouldEscalate(answer),
    });
  } catch (error) {
    console.error(
      "Policy question failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { error: "The policy could not answer that question." },
      { status: 500 },
    );
  }
}
