"use client";

import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/pingpal/types";

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
    <div className="shrink-0 px-4 pt-2 pb-3">
      {/* Reply preview */}
      {replyTo && (
        <div
          className="pp-glass mb-2 flex items-center gap-2 rounded-2xl border border-cyan-400/25 border-l-2 border-l-cyan-400 px-3 py-2"
          style={{ animation: "pp-pop 0.2s ease-out" }}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[11px] text-cyan-300">Replying to message</p>
            <p className="truncate text-slate-400 text-xs">
              {replyTo.is_deleted ? "Deleted message" : replyTo.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 text-slate-500 transition-colors hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating command-bar input */}
      <div className="pp-glass flex items-end gap-2 rounded-[1.75rem] border border-white/10 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all focus-within:border-cyan-400/40 focus-within:shadow-[0_0_24px_rgba(34,211,238,0.15)]">
        {/* Attach button */}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-cyan-300"
          title="Attach file"
        >
          <Paperclip size={17} />
        </button>

        {/* Textarea */}
        <div className="flex flex-1 items-end py-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a conversation..." : "Beam a message..."}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent text-slate-100 text-sm outline-none placeholder:text-slate-500 disabled:opacity-50"
            style={{ maxHeight: 160, lineHeight: "1.5" }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 text-white shadow-[0_0_14px_rgba(103,232,249,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(103,232,249,0.6)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100"
        >
          <Send size={15} />
        </button>
      </div>

      {/* Hint */}
      <p className="mt-1.5 text-center text-[10px] text-slate-600">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
