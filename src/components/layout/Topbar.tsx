/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

type TopbarProps = {
  appName: string;
  pageName: string;
  trailSegment?: string | null;
};

export default function Topbar({ appName, pageName, trailSegment }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render theme toggle after mount
  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-border border-b bg-background px-4">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="shrink-0 text-muted-foreground">{appName}</span>
        <ChevronRight size={13} className="shrink-0 text-muted-foreground/40" />
        <span
          className={
            trailSegment ? "shrink-0 text-muted-foreground" : "font-medium text-foreground"
          }
        >
          {pageName}
        </span>
        {trailSegment ? (
          <>
            <ChevronRight size={13} className="shrink-0 text-muted-foreground/40" />
            <span className="truncate font-medium text-foreground" title={trailSegment}>
              {trailSegment}
            </span>
          </>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        {mounted && (
          <Button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
        )}
      </div>
    </header>
  );
}
