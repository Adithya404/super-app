import { tool } from "ai";
import { z } from "zod";

interface TavilySearchResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string | null;
}

interface TavilySearchResponse {
  query?: string;
  answer?: string | null;
  results?: TavilySearchResult[];
}

export const browserSearch = tool({
  description:
    "Search the live web for current information. Use for news, recent events, prices, sports scores, or anything that may have changed after your knowledge cutoff. Prefer this over guessing from memory when the user needs up-to-date facts.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  contextSchema: z.object({
    apiKey: z.string(),
  }),
  execute: async ({ query }, { context, abortSignal }) => {
    if (!context.apiKey) {
      throw new Error("Tavily API key is required for web search");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: abortSignal,
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TavilySearchResponse;

    return {
      query: data.query ?? query,
      answer: data.answer ?? null,
      results: (data.results ?? []).map((result) => ({
        title: result.title ?? "",
        url: result.url ?? "",
        snippet: result.content ?? "",
        score: result.score,
        publishedDate: result.published_date ?? null,
      })),
    };
  },
});
