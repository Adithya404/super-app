"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, generateId, getToolName, isToolUIPart } from "ai";
import { BorderBeam } from "border-beam";
import { FileIcon, MessageSquareIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import type { BundledLanguage } from "shiki";
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
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useBreadcrumbTrail } from "@/components/layout/breadcrumb-trail";
import type { ChatUIMessage } from "@/lib/ai";
import { createChatSession, getChatTitle } from "./actions";
import { revalidateChatHistory } from "./chat-history-keys";
import { ChatPromptSubmit } from "./components/chat-prompt-submit";
import {
  ChatThinkingOrb,
  getOrbStateForToolName,
  getOrbStateLabel,
  resolveActiveOrbState,
  resolveChatOrbState,
} from "./components/chat-thinking-orb";
import { ChatWelcome } from "./components/chat-welcome";
import { getArtifactFilename, getToolUI } from "./components/tool-ui-registry";
import { getToolStepStatus } from "./orb-state";

const PENDING_MESSAGE_KEY = "sb-chat-pending-message";

function messageHasVisibleText(message: ChatUIMessage): boolean {
  return message.parts.some(
    (part) => part.type === "text" && typeof part.text === "string" && part.text.trim().length > 0,
  );
}

type CodeLanguage = "json" | "typescript" | "python" | "yaml";

const CODE_LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { label: "JSON", value: "json" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "YAML", value: "yaml" },
];

type SearchResultItem = {
  title?: string;
  url?: string;
  snippet?: string;
};

function isSearchToolOutput(
  output: unknown,
): output is { answer?: string | null; results?: SearchResultItem[] } {
  return (
    !!output &&
    typeof output === "object" &&
    "results" in output &&
    Array.isArray((output as { results: unknown }).results)
  );
}

function renderToolOutput(output: unknown) {
  if (output == null) return null;

  if (isSearchToolOutput(output)) {
    const items = output.results ?? [];
    if (items.length === 0) return null;

    return (
      <ChainOfThoughtSearchResults>
        {items.slice(0, 5).map((result, index) => {
          const label = result.title || result.url || `Result ${index + 1}`;
          return (
            <ChainOfThoughtSearchResult key={result.url ?? `${label}-${index}`}>
              {result.url ? (
                <a href={result.url} rel="noreferrer" target="_blank">
                  {label}
                </a>
              ) : (
                label
              )}
            </ChainOfThoughtSearchResult>
          );
        })}
      </ChainOfThoughtSearchResults>
    );
  }

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
  const toolUI = getToolUI(name);

  return (
    <Artifact>
      <ArtifactHeader>
        <div>
          <ArtifactTitle>{toolUI.artifactTitle}</ArtifactTitle>
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

interface ChatProps {
  chatId?: string;
  initialMessages?: ChatUIMessage[];
  initialTitle?: string | null;
  isNewChat?: boolean;
}

export default function Chat({
  chatId,
  initialMessages = [],
  initialTitle = null,
  isNewChat = false,
}: ChatProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { setTrailSegment } = useBreadcrumbTrail();
  const [input, setInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setTrailSegment(isNewChat || !chatId ? null : initialTitle);
    return () => setTrailSegment(null);
  }, [chatId, initialTitle, isNewChat, setTrailSegment]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        prepareSendMessagesRequest({ id, messages }) {
          const message = messages.at(-1);
          if (!message || message.role !== "user") {
            throw new Error("Expected a user message to send");
          }

          return {
            body: {
              id,
              message: {
                id: message.id,
                role: message.role,
                parts: message.parts,
              },
            },
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat<ChatUIMessage>({
    ...(chatId ? { id: chatId } : {}),
    messages: initialMessages,
    transport,
    onFinish: async () => {
      await revalidateChatHistory();
      if (!chatId) {
        return;
      }
      const title = await getChatTitle(chatId);
      if (title) {
        setTrailSegment(title);
      }
    },
  });

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_MESSAGE_KEY);
    if (!pending || !chatId) return;

    sessionStorage.removeItem(PENDING_MESSAGE_KEY);
    sendMessage({ text: pending });
  }, [chatId, sendMessage]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text.trim() || isCreating) return;

    if (!chatId) {
      setIsCreating(true);
      try {
        const newId = generateId();
        await createChatSession(newId);
        sessionStorage.setItem(PENDING_MESSAGE_KEY, message.text);
        router.replace(`/sb/config/chat/${newId}`);
      } finally {
        setIsCreating(false);
      }
      return;
    }

    sendMessage({ text: message.text });
    setInput("");
  };

  const showWelcome = isNewChat && messages.length === 0;
  const showEmptyState = !isNewChat && messages.length === 0;
  const isSubmitDisabled =
    isCreating || (status === "ready" && !input.trim()) || status === "submitted";

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const lastAssistantToolParts = lastAssistantMessage?.parts.filter(isToolUIPart) ?? [];
  const chatOrbState = resolveChatOrbState({ status, toolParts: lastAssistantToolParts });
  const isGenerating = status === "submitted" || status === "streaming";
  const lastMessage = messages.at(-1);
  const lastMessageToolCount = lastMessage?.parts.filter(isToolUIPart).length ?? 0;
  const showStandaloneThinkingOrb =
    isGenerating &&
    (lastMessage?.role === "user" ||
      (lastMessage?.role === "assistant" &&
        !messageHasVisibleText(lastMessage) &&
        lastMessageToolCount === 0));
  const showStreamingComposingRow =
    isGenerating &&
    lastMessage?.role === "assistant" &&
    messageHasVisibleText(lastMessage) &&
    lastMessageToolCount === 0;

  return (
    <div className="relative h-full min-h-0 w-full">
      <Conversation key={chatId ?? "new"} className="absolute inset-0" initial="instant">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 pt-4 pb-36 md:px-6">
          {showWelcome ? (
            <ChatWelcome onSuggestionClick={setInput} />
          ) : showEmptyState ? (
            <ConversationEmptyState
              description="Ask anything or search the web for the latest info."
              icon={<MessageSquareIcon className="size-6" />}
              title="Start a conversation"
            />
          ) : (
            messages.map((message) => {
              const toolParts = message.parts.filter(isToolUIPart);
              const isLastMessage = message.id === messages.at(-1)?.id;
              const isWorking = status !== "ready" && isLastMessage && message.role === "assistant";
              const hasActiveTool = toolParts.some(
                (part) => getToolStepStatus(part.state) === "active",
              );
              const workingOrbState = hasActiveTool
                ? resolveActiveOrbState(toolParts)
                : status === "streaming"
                  ? "composing"
                  : "working";

              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {toolParts.length > 0 && (
                      <ChainOfThought defaultOpen={isWorking}>
                        <ChainOfThoughtHeader
                          leading={
                            isWorking ? (
                              <ChatThinkingOrb size={20} state={workingOrbState} />
                            ) : undefined
                          }
                        >
                          {isWorking ? "Thinking..." : "Chain of Thought"}
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          {toolParts.map((part) => {
                            const name = getToolName(part);
                            const toolUI = getToolUI(name);
                            const Icon = toolUI.icon;
                            const stepStatus = getToolStepStatus(part.state);
                            const stepOrbState = getOrbStateForToolName(name);

                            return (
                              <ChainOfThoughtStep
                                key={part.toolCallId}
                                icon={
                                  stepStatus === "active" ? (
                                    <ChatThinkingOrb size={20} state={stepOrbState} />
                                  ) : (
                                    Icon
                                  )
                                }
                                label={toolUI.getLabel(part.input)}
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
                      const toolUI = getToolUI(name);
                      if (toolUI.showArtifact === false) return null;
                      return (
                        <ToolResultArtifact
                          key={`${part.toolCallId}-artifact`}
                          name={name}
                          description={toolUI.getLabel(part.input)}
                          output={part.output}
                        />
                      );
                    })}

                    {showStreamingComposingRow && isLastMessage && message.role === "assistant" ? (
                      <div className="flex items-center gap-2 pt-1 text-muted-foreground text-xs">
                        <ChatThinkingOrb size={20} state="composing" />
                        <span>{getOrbStateLabel("composing")}…</span>
                      </div>
                    ) : null}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {showStandaloneThinkingOrb ? (
            <Message from="assistant">
              <MessageContent className="flex-row items-center gap-3 py-1">
                <ChatThinkingOrb size={64} state={chatOrbState} />
                <span className="text-muted-foreground text-sm">
                  {getOrbStateLabel(chatOrbState)}…
                </span>
              </MessageContent>
            </Message>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton className="bottom-28" />
      </Conversation>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-background via-background to-transparent pt-10">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl px-4 pb-4 md:px-6">
          <BorderBeam
            size="md"
            colorVariant="colorful"
            strength={0.7}
            theme={resolvedTheme === "light" ? "light" : "dark"}
            className="w-full"
          >
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  onChange={(e) => setInput(e.currentTarget.value)}
                  placeholder="Say something..."
                  value={input}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools />
                <ChatPromptSubmit
                  chatStatus={status}
                  disabled={isSubmitDisabled}
                  isCreating={isCreating}
                  onStop={stop}
                  orbState={chatOrbState}
                />
              </PromptInputFooter>
            </PromptInput>
          </BorderBeam>
        </div>
      </div>
    </div>
  );
}
