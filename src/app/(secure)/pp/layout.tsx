/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apps } from "@/components/layout/apps/registry";
import ChatSidebar from "@/components/pingpal/ChatSidebar";
import {
  PingPalWSProvider,
  usePingPalWS,
  type WSMessage,
} from "@/components/pingpal/pingpal-ws-context";
import {
  requestNotificationPermission,
  showMessageNotification,
} from "@/lib/pingpal/notifications";

export type Room = {
  id: string;
  display_name: string;
  type: "dm" | "group";
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  unread_count: number;
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  updated_at: string;
};

export type { WSMessage };

type PingPalLayoutProps = {
  children: React.ReactNode;
};

export default function PingPalLayout({ children }: PingPalLayoutProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const wsEnabled = Boolean(userId);

  return (
    <PingPalWSProvider enabled={wsEnabled}>
      <PingPalLayoutInner userId={userId}>{children}</PingPalLayoutInner>
    </PingPalWSProvider>
  );
}

function PingPalLayoutInner({ children, userId }: { children: React.ReactNode; userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRoomId = searchParams.get("roomId") ?? undefined;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const activeRoomIdRef = useRef(activeRoomId);
  const userIdRef = useRef(userId);
  const roomsRef = useRef(rooms);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/pingpal/rooms");
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const handler = () => fetchRooms();
    window.addEventListener("pingpal:rooms-changed", handler);
    return () => window.removeEventListener("pingpal:rooms-changed", handler);
  }, [fetchRooms]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Clear unread badge when switching to a room
  useEffect(() => {
    if (!activeRoomId) return;
    setRooms((prev) => prev.map((r) => (r.id === activeRoomId ? { ...r, unread_count: 0 } : r)));
  }, [activeRoomId]);

  const { subscribe, send } = usePingPalWS();

  const handleWSMessage = useCallback(
    (msg: WSMessage) => {
      switch (msg.type) {
        case "new_message": {
          const message = msg.message;
          const isOwnMessage = message.sender_id === userIdRef.current;
          const isActiveRoom = message.room_id === activeRoomIdRef.current;

          setRooms((prev) =>
            prev
              .map((r) =>
                r.id === message.room_id
                  ? {
                      ...r,
                      last_message: message,
                      updated_at: message.created_at,
                      unread_count: isActiveRoom
                        ? 0
                        : isOwnMessage
                          ? r.unread_count
                          : r.unread_count + 1,
                    }
                  : r,
              )
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
          );

          if (!isOwnMessage && (!isActiveRoom || document.hidden)) {
            const room = roomsRef.current.find((r) => r.id === message.room_id);
            const preview = message.is_deleted
              ? "Deleted message"
              : message.content?.trim() || "New message";

            showMessageNotification({
              title: room?.display_name ?? "New message",
              body: preview,
              roomId: message.room_id,
              onClick: () => {
                const basePath =
                  room?.type === "group" ? "/pp/messaging/groups" : "/pp/messaging/dm";
                router.push(`${basePath}?roomId=${message.room_id}`);
              },
            });
          }
          break;
        }

        case "room_created": {
          setRooms((prev) => [msg.room, ...prev]);
          break;
        }

        case "room_updated": {
          setRooms((prev) => prev.map((r) => (r.id === msg.room.id ? { ...r, ...msg.room } : r)));
          break;
        }
      }
    },
    [router],
  );

  // Register layout-level WS handler on the shared connection
  useEffect(() => {
    return subscribe(handleWSMessage);
  }, [subscribe, handleWSMessage]);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <ChatSidebar
        rooms={rooms}
        loading={loadingRooms}
        activeRoomId={activeRoomId}
        currentUserId={userId}
        onRoomsChange={fetchRooms}
        send={send}
        apps={apps}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
