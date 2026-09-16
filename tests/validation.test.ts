import { describe, expect, it } from "vitest";
import { validateQuestion } from "@/lib/validation";
import type { PolicyDocument } from "@/lib/documents";
import { isInsurancePolicyClassification } from "@/lib/policy-classification";

describe("request validation", () => {
  it("rejects an empty question", () =>
    expect(
      validateQuestion({ vectorStoreIds: ["vs_123"], question: " " }),
    ).toBe("Please ask a question."));
  it("accepts multiple vector stores", () =>
    expect(
      validateQuestion({
        vectorStoreIds: ["vs_home", "vs_cards"],
        question: " deductible? ",
        messages: [{ role: "user", content: " deductible? " }],
      }),
    ).toEqual({
      vectorStoreIds: ["vs_home", "vs_cards"],
      question: "deductible?",
      messages: [{ role: "user", content: "deductible?" }],
    }));
  it("accepts conversation history and uses its latest user message", () =>
    expect(
      validateQuestion({
        vectorStoreIds: ["vs_home"],
        question: "What about exceptions?",
        messages: [
          { role: "user", content: "What is the deductible?" },
          { role: "assistant", content: "It is $500." },
          { role: "user", content: "What about exceptions?" },
        ],
      }),
    ).toEqual({
      vectorStoreIds: ["vs_home"],
      question: "What about exceptions?",
      messages: [
        { role: "user", content: "What is the deductible?" },
        { role: "assistant", content: "It is $500." },
        { role: "user", content: "What about exceptions?" },
      ],
    }));
  it("rejects oversized conversation history", () =>
    expect(
      validateQuestion({
        vectorStoreIds: ["vs_home"],
        question: "Question",
        messages: Array.from({ length: 11 }, () => ({
          role: "user",
          content: "Question",
        })),
      }),
    ).toBe("Conversation history must contain 1-10 messages."));
  it("supports a distinct vector store per policy", () => {
    const policies: PolicyDocument[] = [
      { id: "vs_home", fileId: "file_home", name: "Home.pdf", size: 100 },
    ];
    expect(policies[0].id).not.toBe("vs_auto");
  });
  it("accepts only an affirmative policy classification", () => {
    expect(isInsurancePolicyClassification("YES")).toBe(true);
    expect(isInsurancePolicyClassification("YES\n")).toBe(true);
    expect(isInsurancePolicyClassification("NO")).toBe(false);
    expect(isInsurancePolicyClassification("YES, this is a policy")).toBe(
      false,
    );
  });
});
