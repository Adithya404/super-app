/** biome-ignore-all lint/a11y/noStaticElementInteractions: <later> */
"use client";

import { Pencil, Reply, Smile, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { getReplyPreview, getReplySenderName } from "@/lib/pingpal/messages";
import type { Message } from "@/lib/pingpal/types";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  senderName: string;
  senderNames: Record<string, string>;
  isGroup?: boolean;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: Message) => void;
};

export default function MessageBubble({
  message,
  isOwn,
  senderName,
  senderNames,
  isGroup,
  currentUserId,
  onReact,
  onEdit,
  onDelete,
  onReply,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editRef = useRef<HTMLInputElement>(null);

  function handleEditSubmit() {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  }

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-0.5`}>
        <span className="px-3 py-1.5 text-muted-foreground/50 text-xs italic">
          This message was deleted
        </span>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center px-4 py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground/60 text-xs">
          {message.content}
        </span>
      </div>
    );
  }

  const replyPreview = getReplyPreview(message.reply_to);
  const replySender = getReplySenderName(message.reply_to, senderNames);

  return (
    <div
      className={`group flex gap-2 px-4 py-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmoji(false);
      }}
    >
      {!isOwn && isGroup && (
        <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-primary/10 font-medium text-[11px] text-primary">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}

      {isOwn && isGroup && <div className="w-7 shrink-0" />}

      <div className={`flex max-w-[70%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && isGroup && (
          <span className="px-1 font-medium text-[11px] text-muted-foreground">{senderName}</span>
        )}

        <div className="relative">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={editRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSubmit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="min-w-50 rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={handleEditSubmit}
                className="font-medium text-primary text-xs hover:underline"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-muted-foreground text-xs hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isOwn
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-muted text-foreground"
              }`}
            >
              {message.reply_to && replyPreview && (
                <div
                  className={`mb-1.5 rounded-lg border-l-2 py-0.5 pl-2 text-xs opacity-80 ${
                    isOwn ? "border-primary-foreground/40" : "border-primary/40"
                  }`}
                >
                  <p className="font-medium opacity-90">{replySender}</p>
                  <p className="truncate opacity-75">{replyPreview}</p>
                </div>
              )}

              {message.content}
              {message.is_edited && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
            </div>
          )}

          {!isEditing && showActions && (
            <div
              className={`absolute -top-8 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-md ${
                isOwn ? "right-0" : "left-0"
              }`}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="React"
                >
                  <Smile size={13} />
                </button>

                {showEmoji && (
                  <div
                    className={`absolute top-7 z-20 flex gap-0.5 rounded-lg border border-border bg-background p-1 shadow-lg ${
                      isOwn ? "right-0" : "left-0"
                    }`}
                  >
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => {
                          onReact(message.id, emoji);
                          setShowEmoji(false);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded text-base hover:bg-muted"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onReply(message)}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Reply"
              >
                <Reply size={13} />
              </button>

              {isOwn && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(message.content);
                      setIsEditing(true);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.reactions.map((reaction) => {
              const reacted = reaction.user_ids.includes(currentUserId);
              return (
                <button
                  type="button"
                  key={reaction.emoji}
                  onClick={() => onReact(message.id, reaction.emoji)}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    reacted
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        <span className="px-1 text-[10px] text-muted-foreground/50">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
