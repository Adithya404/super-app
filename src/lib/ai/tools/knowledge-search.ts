import { tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/knowledge-store";

export const searchKnowledge = tool({
  description:
    "Search this chat domain's knowledge base for product docs, policies, and internal FAQs. Use for domain-specific questions before guessing from memory.",
  inputSchema: z.object({
    question: z.string().describe("The user question to retrieve context for"),
  }),
  contextSchema: z.object({
    domainId: z.string().min(1),
  }),
  execute: async ({ question }, { context }) =>
    findRelevantContent(question, { domainId: context.domainId }),
});
