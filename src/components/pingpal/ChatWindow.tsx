/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Room, WSMessage } from "@/app/(secure)/pp/layout";
import type { Message } from "@/app/(secure)/pp/messaging/dm/page";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import RoomHeader from "./RoomHeader";
import TypingIndicator from "./TypingIndicator";

type ChatWindowProps = {
  roomId: string;
  messages: Message[];
  loading: boolean;
  currentUserId: string;
  isTyping: Record<string, boolean>;
  onSend: (content: string, replyToId?: string) => void;
  onTyping: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  send: (msg: WSMessage) => void;
  isGroup?: boolean;
};

// Group consecutive messages from the same sender
function groupMessages(messages: Message[]) {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const isFirstInGroup =
      !prev ||
      prev.sender_id !== msg.sender_id ||
      new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
    const isLastInGroup =
      !next ||
      next.sender_id !== msg.sender_id ||
      new Date(next.created_at).getTime() - new Date(msg.created_at).getTime() > 5 * 60 * 1000;
    return { msg, isFirstInGroup, isLastInGroup };
  });
}

// Format date separator label
function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export default function ChatWindow({
  roomId,
  messages,
  loading,
  currentUserId,
  isTyping,
  onSend,
  onTyping,
  onReact,
  onEdit,
  onDelete,
  send,
  isGroup,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch room details for the header
  useEffect(() => {
    fetch(`/api/pingpal/rooms/${roomId}`)
      .then((r) => r.json())
      .then((d) => setRoom(d.room));
  }, [roomId]);

  // Build a map of senderId → name from messages
  useEffect(() => {
    const unknowns = messages
      .map((m) => m.sender_id)
      .filter((id) => id !== currentUserId && !senderNames[id]);
    if (!unknowns.length) return;

    fetch(`/api/pingpal/users?ids=${[...new Set(unknowns)].join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        // biome-ignore lint/suspicious/noExplicitAny: <later>
        d.users?.forEach((u: any) => {
          map[u.id] = u.name ?? u.email;
        });
        setSenderNames((prev) => ({ ...prev, ...map }));
      });
  }, [messages, currentUserId, senderNames]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Mark room as read when opened
  useEffect(() => {
    send({ type: "mark_read", roomId });
  }, [roomId, send]);

  const typingUserIds = Object.entries(isTyping)
    .filter(([, v]) => v)
    .map(([id]) => id);

  const grouped = groupMessages(messages);

  // Detect date boundaries for separators
  function shouldShowDate(index: number) {
    if (index === 0) return true;
    const curr = new Date(messages[index].created_at).toDateString();
    const prev = new Date(messages[index - 1].created_at).toDateString();
    return curr !== prev;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      {room && <RoomHeader room={room} currentUserId={currentUserId} isGroup={isGroup} />}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          grouped.map(({ msg, isFirstInGroup }, i) => (
            <div key={msg.id}>
              {/* Date separator */}
              {shouldShowDate(i) && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 border-border border-t" />
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateLabel(msg.created_at)}
                  </span>
                  <div className="flex-1 border-border border-t" />
                </div>
              )}

              {/* Spacing between groups */}
              {isFirstInGroup && i !== 0 && !shouldShowDate(i) && <div className="h-3" />}

              <MessageBubble
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                senderName={senderNames[msg.sender_id] ?? "Unknown"}
                isGroup={isGroup}
                onReact={onReact}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={setReplyTo}
              />
            </div>
          ))
        )}

        {/* Typing indicator */}
        <TypingIndicator userIds={typingUserIds} />

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={onSend}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
