"use client";

import { type ChatStatus, type DynamicToolUIPart, getToolName, type ToolUIPart } from "ai";
import type { ComponentProps } from "react";
import type { OrbState } from "thinking-orbs";
import { ThinkingOrb } from "thinking-orbs";
import { cn } from "@/lib/utils";
import { getToolStepStatus } from "../orb-state";

type ChatThinkingOrbProps = Omit<ComponentProps<typeof ThinkingOrb>, "state"> & {
  state?: OrbState;
};

export function ChatThinkingOrb({
  className,
  size = 20,
  theme = "auto",
  ...props
}: ChatThinkingOrbProps) {
  return (
    <ThinkingOrb
      aria-hidden
      className={cn("block shrink-0", className)}
      size={size}
      theme={theme}
      {...props}
    />
  );
}

export const ORB_STATE_LABELS: Record<OrbState, string> = {
  breathing: "Breathing",
  composing: "Composing",
  connecting: "Connecting",
  listening: "Listening",
  searching: "Searching",
  shaping: "Shaping",
  solving: "Solving",
  weaving: "Weaving",
  working: "Working",
};

export function getOrbStateLabel(state: OrbState): string {
  return ORB_STATE_LABELS[state];
}

export function getOrbStateForToolName(toolName: string): OrbState {
  switch (toolName) {
    case "browser_search":
    case "search_knowledge":
      return "searching";
    case "getWeather":
      return "connecting";
    case "convertFahrenheitToCelsius":
      return "solving";
    default:
      return "working";
  }
}

export function resolveActiveOrbState(toolParts: (ToolUIPart | DynamicToolUIPart)[]): OrbState {
  const activePart = toolParts.find((part) => getToolStepStatus(part.state) === "active");
  if (!activePart) {
    return "working";
  }

  return getOrbStateForToolName(getToolName(activePart));
}

export function resolveChatOrbState({
  status,
  toolParts,
}: {
  status: ChatStatus;
  toolParts: (ToolUIPart | DynamicToolUIPart)[];
}): OrbState {
  if (status === "submitted") {
    return "connecting";
  }

  const hasActiveTool = toolParts.some((part) => getToolStepStatus(part.state) === "active");
  if (hasActiveTool) {
    return resolveActiveOrbState(toolParts);
  }

  if (status === "streaming") {
    return "composing";
  }

  return "working";
}
