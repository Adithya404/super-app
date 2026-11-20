"use client";

import type { ChatStatus } from "ai";
import { SquareIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { OrbState } from "thinking-orbs";
import { PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { ChatThinkingOrb } from "./chat-thinking-orb";

type ChatPromptSubmitProps = Omit<
  ComponentProps<typeof PromptInputSubmit>,
  "status" | "children"
> & {
  chatStatus: ChatStatus;
  isCreating?: boolean;
  orbState?: OrbState;
};

export function ChatPromptSubmit({
  chatStatus,
  isCreating = false,
  orbState = "working",
  ...props
}: ChatPromptSubmitProps) {
  const status = isCreating ? "submitted" : chatStatus;
  const showOrb = status === "submitted" || status === "streaming";
  const { onStop } = props;

  return (
    <PromptInputSubmit status={status} {...props}>
      {showOrb ? (
        status === "streaming" && onStop ? (
          <span className="relative inline-flex size-4 items-center justify-center">
            <ChatThinkingOrb
              className="absolute inset-0 m-auto opacity-60"
              size={20}
              state={orbState}
            />
            <SquareIcon className="relative z-10 size-3.5 fill-current" />
          </span>
        ) : (
          <ChatThinkingOrb size={20} state={orbState} />
        )
      ) : undefined}
    </PromptInputSubmit>
  );
}
