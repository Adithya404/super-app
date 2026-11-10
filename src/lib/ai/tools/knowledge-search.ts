import { tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/knowledge-store";

export const searchKnowledge = tool({
  description:
    "Search the Sabre knowledge base for product docs, policies, and internal FAQs. Use for Sabre/app/company-specific questions before guessing from memory.",
  inputSchema: z.object({
    question: z.string().describe("The user question to retrieve context for"),
  }),
  execute: async ({ question }) => findRelevantContent(question),
});
