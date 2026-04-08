/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <later> */
/** biome-ignore-all lint/correctness/noInvalidUseBeforeDeclaration: <later> */
"use client";

import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ChatWindow from "@/components/pingpal/ChatWindow";
import EmptyState from "@/components/pingpal/EmptyState";
import { useWebSocket } from "@/hooks/useWebSocket";

export type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  file_url: string | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export default function DMPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch message history when room changes
  const fetchMessages = useCallback(async (rid: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/pingpal/rooms/${rid}/messages`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    setIsTyping({});
    fetchMessages(roomId);
  }, [roomId, fetchMessages]);

  // Handle incoming WS messages for this room
  // biome-ignore lint/correctness/useExhaustiveDependencies: <later>
  const handleWSMessage = useCallback(
    (msg: any) => {
      switch (msg.type) {
        case "new_message": {
          if (msg.message.room_id !== roomId) return;
          setMessages((prev) => [...prev, msg.message]);
          // Mark as read since we're viewing this room
          if (roomId) {
            send({ type: "mark_read", roomId });
          }
          break;
        }

        case "message_edited": {
          if (msg.message.room_id !== roomId) return;
          setMessages((prev) => prev.map((m) => (m.id === msg.message.id ? msg.message : m)));
          break;
        }

        case "message_deleted": {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.messageId ? { ...m, is_deleted: true, content: "" } : m)),
          );
          break;
        }

        case "typing": {
          if (msg.userId === session?.user?.id) return;
          setIsTyping((prev) => ({ ...prev, [msg.userId]: msg.isTyping }));
          break;
        }

        case "reaction": {
          // Re-fetch messages to get updated reactions
          // (or optimistically update if you track reactions in state)
          if (roomId) fetchMessages(roomId);
          break;
        }
      }
    },
    [roomId, session?.user?.id, fetchMessages],
  );

  const { send } = useWebSocket(session?.user?.id ?? "", handleWSMessage);

  // Send a message
  const handleSend = useCallback(
    (content: string, replyToId?: string) => {
      if (!roomId || !content.trim()) return;
      send({ type: "send_message", roomId, content: content.trim(), replyToId });
    },
    [roomId, send],
  );

  // Send typing indicator with debounce
  const handleTyping = useCallback(() => {
    if (!roomId) return;
    send({ type: "typing", roomId, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => {
      send({ type: "typing", roomId, isTyping: false });
    }, 2000);
    setTypingTimeout(t);
  }, [roomId, send, typingTimeout]);

  // Handle reactions
  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      if (!roomId) return;
      send({ type: "react", messageId, emoji, roomId });
    },
    [roomId, send],
  );

  // Handle edit
  const handleEdit = useCallback(
    async (messageId: string, content: string) => {
      await fetch(`/api/pingpal/rooms/${roomId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    [roomId],
  );

  // Handle delete
  const handleDelete = useCallback(
    async (messageId: string) => {
      await fetch(`/api/pingpal/rooms/${roomId}/messages/${messageId}`, {
        method: "DELETE",
      });
    },
    [roomId],
  );

  return (
    <>
      {!roomId ? (
        <EmptyState
          icon={<MessageCircle size={40} className="text-muted-foreground/40" />}
          title="Your Direct Messages"
          description="Select a conversation or start a new one"
        />
      ) : (
        <ChatWindow
          roomId={roomId}
          messages={messages}
          loading={loadingMessages}
          currentUserId={session?.user?.id ?? ""}
          isTyping={isTyping}
          onSend={handleSend}
          onTyping={handleTyping}
          onReact={handleReact}
          onEdit={handleEdit}
          onDelete={handleDelete}
          send={send}
        />
      )}
    </>
  );
}
