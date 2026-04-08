"use client";

import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "@/app/(secure)/pp/messaging/dm/page";

type MessageInputProps = {
  onSend: (content: string, replyToId?: string) => void;
  onTyping: () => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
};

export default function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when reply target changes
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  function handleSend() {
    if (!content.trim() || disabled) return;
    onSend(content.trim(), replyTo?.id);
    setContent("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onCancelReply();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 border-border border-t bg-background px-4 py-3">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[11px] text-primary">Replying</p>
            <p className="truncate text-muted-foreground text-xs">{replyTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Attach file"
        >
          <Paperclip size={17} />
        </button>

        {/* Textarea */}
        <div className="flex flex-1 items-end rounded-xl border border-border bg-muted/40 px-3 py-2 transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a conversation..." : "Message..."}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            style={{ maxHeight: 160, lineHeight: "1.5" }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Send size={15} />
        </button>
      </div>

      {/* Hint */}
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/40">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
