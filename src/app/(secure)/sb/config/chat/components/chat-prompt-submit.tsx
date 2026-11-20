"use client";

import type { ChatStatus } from "ai";
import { ArrowUp, SquareIcon, XIcon } from "lucide-react";
import { MetalFx, useMetalBend } from "metal-fx";
import { useTheme } from "next-themes";
import { type ComponentProps, useCallback, useRef } from "react";
import type { OrbState } from "thinking-orbs";
import { InputGroupButton } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { ChatThinkingOrb } from "./chat-thinking-orb";

const SEND_BUTTON_SIZE = "size-9";

type ChatPromptSubmitProps = Omit<ComponentProps<typeof InputGroupButton>, "children"> & {
  chatStatus: ChatStatus;
  isCreating?: boolean;
  orbState?: OrbState;
  onStop?: () => void;
};

export function ChatPromptSubmit({
  chatStatus,
  isCreating = false,
  orbState = "working",
  className,
  disabled,
  onClick,
  onStop,
  ...props
}: ChatPromptSubmitProps) {
  const metalRef = useRef<HTMLDivElement>(null);
  useMetalBend(metalRef);

  const { resolvedTheme } = useTheme();
  const status = isCreating ? "submitted" : chatStatus;
  const isGenerating = status === "submitted" || status === "streaming";
  const showOrb = status === "submitted" || status === "streaming";
  const canSubmit = !disabled;
  const metalTheme = resolvedTheme === "light" ? "light" : "dark";

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isGenerating && onStop) {
        event.preventDefault();
        onStop();
        return;
      }
      onClick?.(event);
    },
    [isGenerating, onClick, onStop],
  );

  let icon = <ArrowUp className="size-[18px] stroke-[2.5] text-current" />;
  if (showOrb) {
    icon =
      status === "streaming" && onStop ? (
        <span className="relative inline-flex size-4 items-center justify-center text-current">
          <ChatThinkingOrb
            className="absolute inset-0 m-auto opacity-60"
            size={20}
            state={orbState}
          />
          <SquareIcon className="relative z-10 size-3.5 fill-current" />
        </span>
      ) : (
        <ChatThinkingOrb size={20} state={orbState} />
      );
  } else if (status === "error") {
    icon = <XIcon className="size-4 text-current" />;
  }

  return (
    <MetalFx
      ref={metalRef}
      className={cn("inline-flex shrink-0 rounded-full", SEND_BUTTON_SIZE)}
      glowGain={canSubmit ? 1.35 : 1.15}
      innerShadow
      paused={false}
      preset="chromatic"
      strength={canSubmit ? 1 : 0.88}
      theme={metalTheme}
      variant="circle"
    >
      <InputGroupButton
        aria-label={isGenerating ? "Stop" : "Submit"}
        className={cn(
          SEND_BUTTON_SIZE,
          "rounded-full border-0 bg-transparent text-inherit shadow-none",
          "hover:bg-white/10 dark:hover:bg-white/10",
          "disabled:pointer-events-none disabled:opacity-100",
          canSubmit ? "opacity-100" : "opacity-80",
          className,
        )}
        disabled={disabled}
        onClick={handleClick}
        size="icon-sm"
        type={isGenerating && onStop ? "button" : "submit"}
        variant="ghost"
        {...props}
      >
        {icon}
      </InputGroupButton>
    </MetalFx>
  );
}
