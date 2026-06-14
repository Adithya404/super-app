"use client";

import { useCallback, useEffect, useState } from "react";
import type { WSMessage } from "@/components/pingpal/pingpal-ws-context";
import { applyReactionUpdate } from "@/lib/pingpal/messages";
import type { Message } from "@/lib/pingpal/types";

export function useRoomMessages(roomId: string | null, knownUnreadCount = 0) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingNewer, setLoadingNewer] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [hasMoreNewer, setHasMoreNewer] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);

  const fetchInitial = useCallback(async (rid: string, unreadCount: number) => {
    setLoading(true);
    try {
      const unreadQuery = unreadCount > 0 ? `&unreadCount=${unreadCount}` : "";
      const res = await fetch(`/api/pingpal/rooms/${rid}/messages?aroundUnread=true${unreadQuery}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      setHasMore(data.hasMore ?? false);
      setHasMoreNewer(data.hasMoreNewer ?? false);
      setLastReadAt(data.lastReadAt ?? null);
      setFirstUnreadMessageId(data.firstUnreadMessageId ?? null);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!roomId || loadingMore || !hasMore || messages.length === 0) return;

    const oldest = messages[0];
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/pingpal/rooms/${roomId}/messages?before=${oldest.id}&limit=30`);
      const data = await res.json();
      const older: Message[] = data.messages ?? [];
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
      }
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, loadingMore, hasMore, messages]);

  const loadNewer = useCallback(async () => {
    if (!roomId || loadingNewer || !hasMoreNewer || messages.length === 0) return;

    const newest = messages[messages.length - 1];
    setLoadingNewer(true);
    try {
      const res = await fetch(`/api/pingpal/rooms/${roomId}/messages?after=${newest.id}&limit=30`);
      const data = await res.json();
      const newer: Message[] = data.messages ?? [];
      if (newer.length > 0) {
        setMessages((prev) => [...prev, ...newer]);
      }
      setHasMoreNewer(data.hasMoreNewer ?? false);
    } catch (err) {
      console.error("Failed to load newer messages:", err);
    } finally {
      setLoadingNewer(false);
    }
  }, [roomId, loadingNewer, hasMoreNewer, messages]);

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    setHasMore(false);
    setHasMoreNewer(false);
    setLastReadAt(null);
    setFirstUnreadMessageId(null);
    fetchInitial(roomId, knownUnreadCount);
  }, [roomId, knownUnreadCount, fetchInitial]);

  const handleWSMessage = useCallback(
    (msg: WSMessage) => {
      switch (msg.type) {
        case "new_message": {
          if (msg.message.room_id !== roomId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.message.id)) return prev;
            return [...prev, msg.message];
          });
          setHasMoreNewer(false);
          break;
        }

        case "message_edited": {
          if (msg.message.room_id !== roomId) return;
          setMessages((prev) => prev.map((m) => (m.id === msg.message.id ? msg.message : m)));
          break;
        }

        case "message_deleted": {
          if (msg.roomId && msg.roomId !== roomId) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.messageId ? { ...m, is_deleted: true, content: "" } : m)),
          );
          break;
        }

        case "reaction": {
          if (!roomId) return;
          setMessages((prev) =>
            applyReactionUpdate(prev, {
              messageId: msg.messageId as string,
              userId: msg.userId as string,
              emoji: msg.emoji as string,
              removed: msg.removed as boolean | undefined,
            }),
          );
          break;
        }
      }
    },
    [roomId],
  );

  const updateMessage = useCallback((messageId: string, message: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? message : m)));
  }, []);

  const markMessageDeleted = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: "" } : m)),
    );
  }, []);

  const clearUnreadAnchor = useCallback(() => {
    setFirstUnreadMessageId(null);
  }, []);

  return {
    messages,
    loading,
    loadingMore,
    loadingNewer,
    hasMore,
    hasMoreNewer,
    lastReadAt,
    firstUnreadMessageId,
    loadMore,
    loadNewer,
    handleWSMessage,
    updateMessage,
    markMessageDeleted,
    clearUnreadAnchor,
  };
}
