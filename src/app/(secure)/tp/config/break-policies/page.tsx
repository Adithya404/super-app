"use client";

import { useChat } from "@ai-sdk/react";
import { getToolName, isToolUIPart } from "ai";
import type { LucideIcon } from "lucide-react";
import { CloudIcon, SearchIcon, ThermometerIcon, WrenchIcon } from "lucide-react";
import { useState } from "react";
import type { ChatUIMessage } from "@/app/api/chat/types";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";

const TOOL_ICONS: Record<string, LucideIcon> = {
  weather: CloudIcon,
  convertFahrenheitToCelsius: ThermometerIcon,
  browser_search: SearchIcon,
};

function getToolStepStatus(state: string): "complete" | "active" | "pending" {
  if (state === "output-available" || state === "output-error" || state === "output-denied") {
    return "complete";
  }
  if (state === "input-streaming" || state === "input-available") {
    return "active";
  }
  return "pending";
}

function getToolLabel(name: string, input: unknown): string {
  if (!input || typeof input !== "object") {
    return `Using ${name}`;
  }

  const data = input as Record<string, unknown>;

  switch (name) {
    case "weather":
      return typeof data.location === "string"
        ? `Getting weather for ${data.location}`
        : "Getting weather...";
    case "convertFahrenheitToCelsius":
      return typeof data.temperature === "number"
        ? `Converting ${data.temperature}°F to Celsius`
        : "Converting temperature...";
    case "browser_search":
      return typeof data.query === "string"
        ? `Searching for "${data.query}"`
        : "Searching the web...";
    default:
      return `Using ${name}`;
  }
}

function renderToolOutput(output: unknown) {
  if (output == null) return null;

  if (typeof output === "object") {
    return (
      <ChainOfThoughtSearchResults>
        {Object.entries(output as Record<string, unknown>).map(([key, value]) => (
          <ChainOfThoughtSearchResult key={key}>
            {key}: {String(value)}
          </ChainOfThoughtSearchResult>
        ))}
      </ChainOfThoughtSearchResults>
    );
  }

  return (
    <ChainOfThoughtSearchResults>
      <ChainOfThoughtSearchResult>{String(output)}</ChainOfThoughtSearchResult>
    </ChainOfThoughtSearchResults>
  );
}

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat<ChatUIMessage>();

  return (
    <div className="stretch mx-auto flex w-full max-w-md flex-col gap-4 py-24">
      {messages.map((message) => {
        const toolParts = message.parts.filter(isToolUIPart);
        const isLastMessage = message.id === messages.at(-1)?.id;
        const isWorking = status !== "ready" && isLastMessage;

        return (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {toolParts.length > 0 && (
                <ChainOfThought defaultOpen={isWorking}>
                  <ChainOfThoughtHeader>
                    {isWorking ? "Thinking..." : "Chain of Thought"}
                  </ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    {toolParts.map((part) => {
                      const name = getToolName(part);
                      const Icon = TOOL_ICONS[name] ?? WrenchIcon;
                      const stepStatus = getToolStepStatus(part.state);

                      return (
                        <ChainOfThoughtStep
                          key={part.toolCallId}
                          icon={Icon}
                          label={getToolLabel(name, part.input)}
                          status={stepStatus}
                          description={part.state === "output-error" ? part.errorText : undefined}
                        >
                          {part.state === "output-available" && renderToolOutput(part.output)}
                        </ChainOfThoughtStep>
                      );
                    })}
                  </ChainOfThoughtContent>
                </ChainOfThought>
              )}

              {message.parts.map((part, i) => {
                if (part.type !== "text") return null;
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: parts are append-only while streaming, so the index is stable
                  <MessageResponse key={`${message.id}-text-${i}`}>{part.text}</MessageResponse>
                );
              })}
            </MessageContent>
          </Message>
        );
      })}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed bottom-0 mb-8 w-full max-w-md rounded border border-zinc-300 p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          value={input}
          placeholder="Say something..."
          disabled={status !== "ready"}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
