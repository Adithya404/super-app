/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <later> */
/** biome-ignore-all lint/correctness/noInvalidUseBeforeDeclaration: <d> */
"use client";

import { Plus, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatWindow from "@/components/pingpal/ChatWindow";
import CreateGroupDialog from "@/components/pingpal/CreateGroupDialog";
import EmptyState from "@/components/pingpal/EmptyState";
import { useWebSocket } from "@/hooks/useWebSocket";
import { applyReactionUpdate } from "@/lib/pingpal/messages";
import type { Message } from "@/lib/pingpal/types";

export default function GroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

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

  const sendRef = useRef<(msg: any) => void>(() => {});

  const handleWSMessage = useCallback(
    (msg: any) => {
      switch (msg.type) {
        case "new_message": {
          if (msg.message.room_id !== roomId) return;
          setMessages((prev) => [...prev, msg.message]);
          if (roomId) sendRef.current({ type: "mark_read", roomId });
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

        case "typing": {
          if (msg.userId === session?.user?.id) return;
          setIsTyping((prev) => ({ ...prev, [msg.userId]: msg.isTyping }));
          break;
        }

        case "reaction": {
          if (!roomId) return;
          setMessages((prev) => applyReactionUpdate(prev, msg));
          break;
        }

        case "member_added":
        case "member_removed":
          break;
      }
    },
    [roomId, session?.user?.id],
  );

  const { send } = useWebSocket(session?.user?.id ?? "", handleWSMessage);
  sendRef.current = send;

  const handleSend = useCallback(
    (content: string, replyToId?: string) => {
      if (!roomId || !content.trim()) return;
      send({ type: "send_message", roomId, content: content.trim(), replyToId });
    },
    [roomId, send],
  );

  const handleTyping = useCallback(() => {
    if (!roomId) return;
    send({ type: "typing", roomId, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => {
      send({ type: "typing", roomId, isTyping: false });
    }, 2000);
    setTypingTimeout(t);
  }, [roomId, send, typingTimeout]);

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      if (!roomId) return;
      send({ type: "react", messageId, emoji, roomId });
    },
    [roomId, send],
  );

  const handleEdit = useCallback(
    async (messageId: string, content: string) => {
      if (!roomId) return;
      const res = await fetch(`/api/pingpal/rooms/${roomId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === messageId ? data.message : m)));
      }
    },
    [roomId],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      if (!roomId) return;
      const res = await fetch(`/api/pingpal/rooms/${roomId}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: "" } : m)),
        );
      }
    },
    [roomId],
  );

  return (
    <>
      {!roomId ? (
        <EmptyState
          icon={<Users size={40} className="text-muted-foreground/40" />}
          title="Group Chats"
          description="Create a group or select one to start chatting"
          action={
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              New Group
            </button>
          }
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
          isGroup
        />
      )}

      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(room) => {
          setShowCreateGroup(false);
          send({ type: "join_room", roomId: room.id });
          window.dispatchEvent(new CustomEvent("pingpal:rooms-changed"));
          router.push(`/pp/messaging/groups?roomId=${room.id}`);
        }}
      />
    </>
  );
}
