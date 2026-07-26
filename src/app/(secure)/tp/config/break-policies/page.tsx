"use client";

import { useChat } from "@ai-sdk/react";
import { getToolName, isToolUIPart } from "ai";
import type { LucideIcon } from "lucide-react";
import {
  CloudIcon,
  FileIcon,
  MessageSquareIcon,
  SearchIcon,
  ThermometerIcon,
  WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import type { BundledLanguage } from "shiki";
import type { ChatUIMessage } from "@/app/api/chat/types";
import {
  Artifact,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockLanguageSelector,
  CodeBlockLanguageSelectorContent,
  CodeBlockLanguageSelectorItem,
  CodeBlockLanguageSelectorTrigger,
  CodeBlockLanguageSelectorValue,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

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

function getArtifactTitle(name: string): string {
  switch (name) {
    case "weather":
      return "Weather result";
    case "convertFahrenheitToCelsius":
      return "Temperature conversion";
    case "browser_search":
      return "Search result";
    default:
      return `${name} result`;
  }
}

type CodeLanguage = "json" | "typescript" | "python" | "yaml";

const CODE_LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { label: "JSON", value: "json" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "YAML", value: "yaml" },
];

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

function getArtifactFilename(name: string, language: CodeLanguage): string {
  const base = (() => {
    switch (name) {
      case "weather":
        return "weather";
      case "convertFahrenheitToCelsius":
        return "conversion";
      case "browser_search":
        return "search";
      default:
        return name;
    }
  })();

  switch (language) {
    case "typescript":
      return `${base}.ts`;
    case "python":
      return `${base}.py`;
    case "yaml":
      return `${base}.yaml`;
    default:
      return `${base}.json`;
  }
}

function toPythonLiteral(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const nextPad = "  ".repeat(indent + 1);

  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => `${nextPad}${toPythonLiteral(item, indent + 1)}`).join(",\n");
    return `[\n${items}\n${pad}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const items = entries
      .map(
        ([key, entry]) => `${nextPad}${JSON.stringify(key)}: ${toPythonLiteral(entry, indent + 1)}`,
      )
      .join(",\n");
    return `{\n${items}\n${pad}}`;
  }

  return JSON.stringify(value);
}

function toYamlLiteral(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);

  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (item !== null && typeof item === "object") {
          const nested = toYamlLiteral(item, indent + 1);
          return `${pad}-\n${nested
            .split("\n")
            .map((line) => `${pad}  ${line}`)
            .join("\n")}`;
        }
        return `${pad}- ${toYamlLiteral(item)}`;
      })
      .join("\n");
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, entry]) => {
        if (entry !== null && typeof entry === "object") {
          return `${pad}${key}:\n${toYamlLiteral(entry, indent + 1)}`;
        }
        return `${pad}${key}: ${toYamlLiteral(entry)}`;
      })
      .join("\n");
  }

  return JSON.stringify(value);
}

function formatCodeExamples(value: unknown): Record<CodeLanguage, string> {
  const json = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return {
    json,
    typescript: `export const result = ${json} as const;`,
    python: `result = ${toPythonLiteral(value)}`,
    yaml: toYamlLiteral(value),
  };
}

function ToolResultArtifact({
  name,
  description,
  output,
}: {
  name: string;
  description: string;
  output: unknown;
}) {
  const [language, setLanguage] = useState<CodeLanguage>("json");
  const examples = formatCodeExamples(output);
  const code = examples[language];

  return (
    <Artifact>
      <ArtifactHeader>
        <div>
          <ArtifactTitle>{getArtifactTitle(name)}</ArtifactTitle>
          <ArtifactDescription>{description}</ArtifactDescription>
        </div>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        <CodeBlock
          className="border-none"
          code={code}
          language={language as BundledLanguage}
          showLineNumbers
        >
          <CodeBlockHeader>
            <CodeBlockTitle>
              <FileIcon size={14} />
              <CodeBlockFilename>{getArtifactFilename(name, language)}</CodeBlockFilename>
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockLanguageSelector
                onValueChange={(value) => setLanguage(value as CodeLanguage)}
                value={language}
              >
                <CodeBlockLanguageSelectorTrigger>
                  <CodeBlockLanguageSelectorValue placeholder="Language" />
                </CodeBlockLanguageSelectorTrigger>
                <CodeBlockLanguageSelectorContent>
                  {CODE_LANGUAGES.map((lang) => (
                    <CodeBlockLanguageSelectorItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </CodeBlockLanguageSelectorItem>
                  ))}
                </CodeBlockLanguageSelectorContent>
              </CodeBlockLanguageSelector>
              <CodeBlockCopyButton type="button" />
            </CodeBlockActions>
          </CodeBlockHeader>
        </CodeBlock>
      </ArtifactContent>
    </Artifact>
  );
}

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat<ChatUIMessage>();

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col p-4">
      <Conversation className="relative min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              description="Ask about weather or anything else to begin."
              icon={<MessageSquareIcon className="size-6" />}
              title="Start a conversation"
            />
          ) : (
            messages.map((message) => {
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
                                description={
                                  part.state === "output-error" ? part.errorText : undefined
                                }
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
                        <MessageResponse key={`${message.id}-text-${i}`}>
                          {part.text}
                        </MessageResponse>
                      );
                    })}

                    {toolParts.map((part) => {
                      if (part.state !== "output-available") return null;
                      const name = getToolName(part);
                      return (
                        <ToolResultArtifact
                          key={`${part.toolCallId}-artifact`}
                          name={name}
                          description={getToolLabel(name, part.input)}
                          output={part.output}
                        />
                      );
                    })}
                  </MessageContent>
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput className="mt-4 shrink-0" onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Say something..."
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit
            disabled={status === "ready" && !input.trim()}
            onStop={stop}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
