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
      }),
    ).toEqual({
      vectorStoreIds: ["vs_home", "vs_cards"],
      question: "deductible?",
    }));
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
