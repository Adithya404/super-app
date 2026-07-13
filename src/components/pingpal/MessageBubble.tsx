/** biome-ignore-all lint/a11y/noStaticElementInteractions: <later> */
"use client";

import { Pencil, Reply, Smile, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import CallMessageBubble from "@/components/pingpal/CallMessageBubble";
import { roomGradient } from "@/components/pingpal/ChatSidebar";
import { parseCallMessage } from "@/lib/pingpal/call-messages";
import { getReplyPreview, getReplySenderName } from "@/lib/pingpal/messages";
import type { Message } from "@/lib/pingpal/types";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  senderName: string;
  senderNames: Record<string, string>;
  messageSenderIds: Record<string, string>;
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
  messageSenderIds,
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
        <span className="px-3 py-1.5 text-slate-500 text-xs italic">This message was deleted</span>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center px-4 py-1">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400 text-xs">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.type === "call") {
    const payload = parseCallMessage(message.content);
    if (payload) {
      return (
        <CallMessageBubble message={message} payload={payload} currentUserId={currentUserId} />
      );
    }
  }

  const replyPreview = getReplyPreview(message.reply_to);
  const replySender = getReplySenderName(
    message.reply_to,
    senderNames,
    currentUserId,
    message.reply_to_id,
    messageSenderIds,
  );

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
        <div
          className={`mb-1 flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-xl bg-gradient-to-br font-semibold text-[11px] text-white shadow-md ${roomGradient(message.sender_id)}`}
        >
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}

      {isOwn && isGroup && <div className="w-7 shrink-0" />}

      <div className={`flex max-w-[70%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && isGroup && (
          <span className="px-1 font-medium text-[11px] text-slate-400">{senderName}</span>
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
                className="min-w-50 rounded-2xl border border-cyan-400/40 bg-black/40 px-3 py-2 text-slate-100 text-sm outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
              <button
                type="button"
                onClick={handleEditSubmit}
                className="font-medium text-cyan-300 text-xs hover:underline"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 text-xs hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              style={{ animation: "pp-pop 0.2s ease-out" }}
              className={`px-3.5 py-2 text-sm leading-relaxed ${
                isOwn
                  ? "rounded-[1.25rem_1.25rem_0.375rem_1.25rem] bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)]"
                  : "rounded-[1.25rem_1.25rem_1.25rem_0.375rem] border border-white/10 bg-white/8 text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-md"
              }`}
            >
              {message.reply_to && replyPreview && (
                <div
                  className={`mb-1.5 rounded-lg border-l-2 py-1 pl-2.5 text-xs ${
                    isOwn ? "border-cyan-200/70 bg-white/15" : "border-fuchsia-300/60 bg-black/25"
                  }`}
                >
                  <p className={`font-semibold ${isOwn ? "text-white" : "text-fuchsia-200"}`}>
                    {replySender}
                  </p>
                  <p className={`truncate ${isOwn ? "text-white/85" : "text-slate-300"}`}>
                    {replyPreview}
                  </p>
                </div>
              )}

              {message.content}
              {message.is_edited && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
            </div>
          )}

          {!isEditing && showActions && (
            <div
              className={`absolute -top-8 z-10 flex items-center gap-0.5 rounded-full border border-white/15 bg-[#151533]/95 p-1 shadow-black/40 shadow-xl backdrop-blur-xl ${
                isOwn ? "right-0" : "left-0"
              }`}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-amber-300"
                  title="React"
                >
                  <Smile size={13} />
                </button>

                {showEmoji && (
                  <div
                    className={`absolute top-7 z-20 flex gap-0.5 rounded-full border border-white/15 bg-[#151533]/95 p-1 shadow-black/40 shadow-xl backdrop-blur-xl ${
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
                        className="flex h-7 w-7 items-center justify-center rounded-full text-base transition-transform hover:scale-125 hover:bg-white/10"
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
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-cyan-300"
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
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-violet-300"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-rose-400"
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
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all ${
                    reacted
                      ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        <span className="px-1 text-[10px] text-slate-500">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
