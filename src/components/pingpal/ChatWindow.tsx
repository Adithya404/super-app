/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Room, WSMessage } from "@/app/(secure)/pp/layout";
import type { Message } from "@/lib/pingpal/types";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import RoomHeader from "./RoomHeader";
import TypingIndicator from "./TypingIndicator";

type ChatWindowProps = {
  roomId: string;
  messages: Message[];
  loading: boolean;
  loadingMore?: boolean;
  loadingNewer?: boolean;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  firstUnreadMessageId?: string | null;
  currentUserId: string;
  isTyping: Record<string, boolean>;
  onSend: (content: string, replyToId?: string) => void;
  onTyping: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onLoadMore?: () => void;
  onLoadNewer?: () => void;
  onMarkRead?: () => void;
  onClearUnreadAnchor?: () => void;
  send: (msg: WSMessage) => void;
  isGroup?: boolean;
};

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
  loadingMore = false,
  loadingNewer = false,
  hasMore = false,
  hasMoreNewer = false,
  firstUnreadMessageId = null,
  currentUserId,
  isTyping,
  onSend,
  onTyping,
  onReact,
  onEdit,
  onDelete,
  onLoadMore,
  onLoadNewer,
  onMarkRead,
  onClearUnreadAnchor,
  send,
  isGroup,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const unreadRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const prevScrollHeight = useRef(0);
  const isNearBottom = useRef(true);
  const prevMessageCount = useRef(0);
  const prevLastMessageId = useRef<string | null>(null);
  const pendingUnreadScroll = useRef(false);

  useEffect(() => {
    fetch(`/api/pingpal/rooms/${roomId}`)
      .then((r) => r.json())
      .then((d) => {
        const fetched = d.room;
        if (fetched) {
          setRoom({
            ...fetched,
            display_name: fetched.display_name ?? fetched.name,
          });
        }
      });
  }, [roomId]);

  // Reset scroll refs when switching rooms
  // biome-ignore lint/correctness/useExhaustiveDependencies: roomId intentionally triggers ref reset
  useEffect(() => {
    initialScrollDone.current = false;
    isNearBottom.current = true;
    prevMessageCount.current = 0;
    prevLastMessageId.current = null;
    prevScrollHeight.current = 0;
    pendingUnreadScroll.current = false;
  }, [roomId]);

  const typingUserIds = Object.entries(isTyping)
    .filter(([, v]) => v)
    .map(([id]) => id);

  useEffect(() => {
    const unknowns = [...messages.map((m) => m.sender_id), ...typingUserIds].filter(
      (id) => id !== currentUserId && !senderNames[id],
    );
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
  }, [messages, typingUserIds, currentUserId, senderNames]);

  useEffect(() => {
    send({ type: "join_room", roomId });
  }, [roomId, send]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  // Initial scroll: unread anchor or bottom
  useEffect(() => {
    if (loading || initialScrollDone.current || messages.length === 0) return;

    pendingUnreadScroll.current = Boolean(firstUnreadMessageId);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const scrolledToUnread =
          firstUnreadMessageId &&
          unreadRef.current &&
          (() => {
            isNearBottom.current = false;
            unreadRef.current?.scrollIntoView({ block: "center" });
            return true;
          })();

        if (!scrolledToUnread) {
          if (firstUnreadMessageId) {
            // Retry once more if unread divider wasn't mounted yet
            requestAnimationFrame(() => {
              if (unreadRef.current) {
                isNearBottom.current = false;
                unreadRef.current.scrollIntoView({ block: "center" });
              } else {
                isNearBottom.current = true;
                scrollToBottom("auto");
              }
            });
          } else {
            isNearBottom.current = true;
            scrollToBottom("auto");
          }
        }
        initialScrollDone.current = true;
        pendingUnreadScroll.current = false;
        prevMessageCount.current = messages.length;
        prevLastMessageId.current = lastMessageId;
      });
    });
  }, [loading, messages.length, firstUnreadMessageId, lastMessageId, scrollToBottom]);

  // Preserve scroll position when older messages are prepended
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading || !initialScrollDone.current) return;

    if (
      !loadingMore &&
      prevScrollHeight.current > 0 &&
      messages.length > prevMessageCount.current
    ) {
      requestAnimationFrame(() => {
        el.scrollTop += el.scrollHeight - prevScrollHeight.current;
        prevScrollHeight.current = 0;
      });
    }

    prevMessageCount.current = messages.length;
  }, [messages.length, loading, loadingMore]);

  // Auto-scroll only when a new message arrives at the end and user is near bottom
  useEffect(() => {
    if (!initialScrollDone.current || loading || pendingUnreadScroll.current) return;
    const lastId = messages.at(-1)?.id ?? null;
    if (lastId && lastId !== prevLastMessageId.current && isNearBottom.current) {
      scrollToBottom("smooth");
    }
    if (lastId !== prevLastMessageId.current) {
      prevLastMessageId.current = lastId;
    }
  }, [messages, loading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = distanceFromBottom < 80;

    if (isNearBottom.current) {
      onMarkRead?.();
      if (!hasMoreNewer) onClearUnreadAnchor?.();
    }

    if (el.scrollTop < 100 && hasMore && !loadingMore && onLoadMore) {
      prevScrollHeight.current = el.scrollHeight;
      onLoadMore();
    }

    if (distanceFromBottom < 100 && hasMoreNewer && !loadingNewer && onLoadNewer) {
      onLoadNewer();
    }
  }, [
    hasMore,
    hasMoreNewer,
    loadingMore,
    loadingNewer,
    onLoadMore,
    onLoadNewer,
    onMarkRead,
    onClearUnreadAnchor,
  ]);

  const grouped = groupMessages(messages);

  const messageSenderIds = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of messages) {
      map[m.id] = m.sender_id;
    }
    return map;
  }, [messages]);

  function shouldShowDate(index: number) {
    if (index === 0) return true;
    const curr = new Date(messages[index].created_at).toDateString();
    const prev = new Date(messages[index - 1].created_at).toDateString();
    return curr !== prev;
  }

  const handleSend = useCallback(
    (content: string, replyToId?: string) => {
      onSend(content, replyToId);
      onMarkRead?.();
      onClearUnreadAnchor?.();
      requestAnimationFrame(() => scrollToBottom("smooth"));
    },
    [onSend, onMarkRead, onClearUnreadAnchor, scrollToBottom],
  );

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {room && (
        <RoomHeader
          room={room}
          currentUserId={currentUserId}
          isGroup={isGroup}
          onRoomUpdate={setRoom}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4" onScroll={handleScroll}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}
            {hasMore && !loadingMore && (
              <p className="py-1 text-center text-[11px] text-muted-foreground/60">
                Scroll up for older messages
              </p>
            )}

            {grouped.map(({ msg, isFirstInGroup }, i) => (
              <div key={msg.id}>
                {msg.id === firstUnreadMessageId && (
                  <div ref={unreadRef} className="my-3 flex items-center gap-3 px-4">
                    <div className="flex-1 border-primary/30 border-t" />
                    <span className="font-medium text-[11px] text-primary">Unread messages</span>
                    <div className="flex-1 border-primary/30 border-t" />
                  </div>
                )}

                {shouldShowDate(i) && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 border-border border-t" />
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateLabel(msg.created_at)}
                    </span>
                    <div className="flex-1 border-border border-t" />
                  </div>
                )}

                {isFirstInGroup && i !== 0 && !shouldShowDate(i) && <div className="h-3" />}

                <MessageBubble
                  message={msg}
                  isOwn={msg.sender_id === currentUserId}
                  senderName={senderNames[msg.sender_id] ?? "Unknown"}
                  senderNames={senderNames}
                  messageSenderIds={messageSenderIds}
                  currentUserId={currentUserId}
                  isGroup={isGroup}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={setReplyTo}
                />
              </div>
            ))}

            {hasMoreNewer && !loadingNewer && (
              <p className="py-1 text-center text-[11px] text-muted-foreground/60">
                Scroll down for newer messages
              </p>
            )}
            {loadingNewer && (
              <div className="flex justify-center py-2">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}

        <TypingIndicator userIds={typingUserIds} isGroup={isGroup} userNames={senderNames} />

        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={handleSend}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
