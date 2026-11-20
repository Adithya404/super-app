"use client";

import {
  CodeIcon,
  GlobeIcon,
  LightbulbIcon,
  PenLineIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const WELCOME_SUGGESTIONS = [
  {
    icon: SearchIcon,
    title: "Latest news",
    description: "Catch up on today's top tech headlines",
    prompt: "What are the top tech headlines today?",
  },
  {
    icon: GlobeIcon,
    title: "Research a topic",
    description: "Get current info with live web search",
    prompt: "What's happening with AI right now?",
  },
  {
    icon: PenLineIcon,
    title: "Help me write",
    description: "Draft emails, posts, and documents",
    prompt: "Draft a professional email to my team sharing a project status update",
  },
  {
    icon: LightbulbIcon,
    title: "Brainstorm ideas",
    description: "Explore creative directions together",
    prompt: "Brainstorm five name ideas for a productivity app",
  },
  {
    icon: CodeIcon,
    title: "Code assistance",
    description: "Explain, debug, or write code",
    prompt: "Explain how async/await works in JavaScript with a short example",
  },
  {
    icon: SparklesIcon,
    title: "What can Sabre do?",
    description: "Discover tools and capabilities",
    prompt: "What tools do you have and how can you help me?",
  },
] as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface ChatWelcomeProps {
  onSuggestionClick: (prompt: string) => void;
  className?: string;
}

export function ChatWelcome({ onSuggestionClick, className }: ChatWelcomeProps) {
  const [greeting] = useState(getGreeting);

  return (
    <div
      className={cn("flex size-full flex-col items-center justify-center px-6 py-10", className)}
    >
      <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 size-56 rounded-full bg-indigo-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -right-10 size-32 rounded-full bg-violet-500/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 -left-10 size-28 rounded-full bg-purple-500/10 blur-2xl"
        />

        <div className="relative inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 py-1 pr-3 pl-1.5">
          <span className="font-medium text-indigo-700 text-xs dark:text-indigo-300">Sabre AI</span>
        </div>

        <p className="mt-6 text-muted-foreground text-sm">{greeting}</p>
        <h1 className="mt-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text font-semibold text-4xl text-transparent tracking-tight">
          How can I help you today?
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
          Ask anything — from live web search and research to writing, coding, and brainstorming.
        </p>

        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WELCOME_SUGGESTIONS.map(({ icon: Icon, title, description, prompt }) => (
            <button
              className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:shadow-md"
              key={prompt}
              onClick={() => onSuggestionClick(prompt)}
              type="button"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                <Icon className="size-4" />
              </span>
              <span className="font-medium text-sm">{title}</span>
              <span className="text-muted-foreground text-xs leading-snug">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
