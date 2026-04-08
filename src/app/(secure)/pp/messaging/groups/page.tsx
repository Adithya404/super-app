/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <later> */
/** biome-ignore-all lint/correctness/noInvalidUseBeforeDeclaration: <d> */
"use client";

import { Plus, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ChatWindow from "@/components/pingpal/ChatWindow";
import CreateGroupDialog from "@/components/pingpal/CreateGroupDialog";
import EmptyState from "@/components/pingpal/EmptyState";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Message } from "../dm/page";

export default function GroupsPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <later>
  const handleWSMessage = useCallback(
    (msg: any) => {
      switch (msg.type) {
        case "new_message": {
          if (msg.message.room_id !== roomId) return;
          setMessages((prev) => [...prev, msg.message]);
          if (roomId) send({ type: "mark_read", roomId });
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
          if (roomId) fetchMessages(roomId);
          break;
        }

        case "member_added":
        case "member_removed": {
          // Could refresh room info here if needed
          break;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, session?.user?.id, fetchMessages],
  );

  const { send } = useWebSocket(session?.user?.id ?? "", handleWSMessage);

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
      await fetch(`/api/pingpal/rooms/${roomId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    [roomId],
  );

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

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(room) => {
          setShowCreateGroup(false);
          // Navigate to the new group
          window.location.href = `/pingpal/messaging/groups?roomId=${room.id}`;
        }}
      />
    </>
  );
}
