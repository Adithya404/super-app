"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  return (
    <div className="stretch mx-auto flex w-full max-w-md flex-col gap-4 py-24">
      {messages.map((message) => (
        <Message from={message.role} key={message.id}>
          <MessageContent>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: parts are append-only while streaming, so the index is stable
                    <MessageResponse key={`${message.id}-text-${i}`}>{part.text}</MessageResponse>
                  );
                case "tool-weather":
                case "tool-convertFahrenheitToCelsius":
                case "tool-browser_search":
                  return (
                    <pre key={`${message.id}-${part.toolCallId}`}>
                      {JSON.stringify(part, null, 2)}
                    </pre>
                  );
                default:
                  return null;
              }
            })}
          </MessageContent>
        </Message>
      ))}

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
