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
import { usePingPalWS } from "@/components/pingpal/pingpal-ws-context";
import { useRoomMessages } from "@/hooks/useRoomMessages";

export default function GroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const knownUnreadCount = Number.parseInt(searchParams.get("unread") ?? "0", 10) || 0;
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const {
    messages,
    loading,
    loadingMore,
    loadingNewer,
    hasMore,
    hasMoreNewer,
    firstUnreadMessageId,
    loadMore,
    loadNewer,
    handleWSMessage,
    updateMessage,
    markMessageDeleted,
    clearUnreadAnchor,
  } = useRoomMessages(roomId, knownUnreadCount);

  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const sendRef = useRef<(msg: any) => void>(() => {});

  const handleMarkRead = useCallback(() => {
    if (roomId) sendRef.current({ type: "mark_read", roomId });
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    setIsTyping({});
  }, [roomId]);

  const onWSMessage = useCallback(
    (msg: any) => {
      handleWSMessage(msg);

      switch (msg.type) {
        case "new_message": {
          if (msg.message.room_id !== roomId) return;
          handleMarkRead();
          break;
        }

        case "typing": {
          if (msg.roomId !== roomId) return;
          if (msg.userId === currentUserId) return;
          setIsTyping((prev) => {
            if (!msg.isTyping) {
              const next = { ...prev };
              delete next[msg.userId];
              return next;
            }
            return { ...prev, [msg.userId]: true };
          });
          break;
        }

        case "member_added":
        case "member_removed":
          break;
      }
    },
    [roomId, currentUserId, handleWSMessage, handleMarkRead],
  );

  const { send, subscribe } = usePingPalWS();
  sendRef.current = send;

  useEffect(() => {
    return subscribe(onWSMessage);
  }, [subscribe, onWSMessage]);

  useEffect(() => {
    if (!roomId || loading || firstUnreadMessageId || knownUnreadCount > 0) return;
    handleMarkRead();
  }, [roomId, loading, firstUnreadMessageId, knownUnreadCount, handleMarkRead]);

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
        updateMessage(messageId, data.message);
      }
    },
    [roomId, updateMessage],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      if (!roomId) return;
      const res = await fetch(`/api/pingpal/rooms/${roomId}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        markMessageDeleted(messageId);
      }
    },
    [roomId, markMessageDeleted],
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
          loading={loading}
          loadingMore={loadingMore}
          loadingNewer={loadingNewer}
          hasMore={hasMore}
          hasMoreNewer={hasMoreNewer}
          firstUnreadMessageId={firstUnreadMessageId}
          currentUserId={currentUserId}
          isTyping={isTyping}
          onSend={handleSend}
          onTyping={handleTyping}
          onReact={handleReact}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onLoadMore={loadMore}
          onLoadNewer={loadNewer}
          onMarkRead={handleMarkRead}
          onClearUnreadAnchor={clearUnreadAnchor}
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
