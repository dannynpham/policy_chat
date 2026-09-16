import type { Citation } from "@/lib/citations";

export type HumanReviewReason = "blocked_term" | "insufficient_evidence";

export type Message = {
	role: "user" | "assistant";
	content: string;
	citations?: Citation[];
	needsHumanReview?: boolean;
	reason?: HumanReviewReason;
};