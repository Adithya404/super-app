"use client";

import { CloudIcon, MessageSquareIcon, SparklesIcon, WrenchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WELCOME_SUGGESTIONS = [
  {
    icon: CloudIcon,
    label: "Weather in San Francisco",
    prompt: "What's the weather in San Francisco?",
  },
  {
    icon: WrenchIcon,
    label: "Convert temperature",
    prompt: "Convert 72°F to Celsius",
  },
  {
    icon: SparklesIcon,
    label: "What can Sabre do?",
    prompt: "What tools do you have and how can you help me?",
  },
] as const;

interface ChatWelcomeProps {
  onSuggestionClick: (prompt: string) => void;
  className?: string;
}

export function ChatWelcome({ onSuggestionClick, className }: ChatWelcomeProps) {
  return (
    <div
      className={cn("flex size-full flex-col items-center justify-center px-6 py-10", className)}
    >
      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 size-40 rounded-full bg-indigo-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 -right-6 size-24 rounded-full bg-violet-500/10 blur-2xl"
        />

        <div className="relative mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20 shadow-lg">
          <MessageSquareIcon className="size-8 text-white" />
        </div>

        <Badge
          className="border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
          variant="outline"
        >
          Sabre AI
        </Badge>

        <h2 className="mt-4 font-semibold text-2xl tracking-tight">Welcome to Sabre</h2>
        <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed">
          Your AI assistant for weather lookups, tool-powered answers, and everyday tasks. Send a
          message below or try a suggestion to get started.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {WELCOME_SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
            <Button
              className="h-auto justify-start gap-2 whitespace-normal px-3 py-2.5 text-left"
              key={prompt}
              onClick={() => onSuggestionClick(prompt)}
              type="button"
              variant="outline"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-indigo-500" />
              <span className="text-sm">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
