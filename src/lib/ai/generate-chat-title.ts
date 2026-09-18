import { generateText } from "ai";
import { getModelForRole } from "@/lib/ai/models";

function truncateTitle(text: string, maxLength = 60): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned || "New chat";
  }
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export function fallbackTitleFromPrompt(prompt: string): string {
  return truncateTitle(prompt);
}

function normalizeTitle(raw: string): string {
  return raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^Title:\s*/i, "")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();
}

export async function generateTitleFromUserMessage(prompt: string): Promise<string> {
  const fallback = fallbackTitleFromPrompt(prompt);

  try {
    const { text } = await generateText({
      model: getModelForRole("chat-default"),
      temperature: 0.3,
      system: `You create short chat titles from the user's first message.

Rules:
- Reply with ONLY the title (2 to 5 words)
- Summarize the topic; do NOT repeat or paraphrase the full question
- No quotes, colons, markdown, or trailing punctuation
- Max 60 characters

Examples:
- User: "What are the 7 wonders of the world" → Seven Wonders
- User: "What's the weather in Paris today?" → Paris Weather
- User: "Help me write a SQL join query" → SQL Join Help`,
      prompt: `User message:\n${prompt}`,
    });

    const title = normalizeTitle(text);
    if (!title) {
      return fallback;
    }

    // Reject verbatim echoes of the prompt
    if (title.toLowerCase() === prompt.trim().toLowerCase()) {
      return fallback;
    }

    return title;
  } catch (error) {
    console.error("Failed to generate chat title", error);
    return fallback;
  }
}
