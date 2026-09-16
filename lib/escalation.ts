const HUMAN_REVIEW_TERMS = [
  "override",
  "ignore",
  "ignore previous instructions",
  "bypass",
];

const INSUFFICIENT_ANSWER_PATTERNS = [
  "could not find",
  "couldn't find",
  "not enough evidence",
  "unable to find",
  "not mentioned in the policy",
  "not mentioned in the uploaded",
  "does not provide enough information",
  "no information about",
  "i don't know",
  "i do not know",
  "cannot answer",
];

export function shouldEscalate(answer: string): boolean {
  const normalizedAnswer = answer.toLowerCase();
  return INSUFFICIENT_ANSWER_PATTERNS.some((pattern) =>
    normalizedAnswer.includes(pattern),
  );
}

export function containsHumanReviewTerm(question: string): boolean {
  const normalizedQuestion = question.toLowerCase().replace(/\s+/g, " ").trim();
  return HUMAN_REVIEW_TERMS.some((term) =>
    new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(
      normalizedQuestion,
    ),
  );
}
