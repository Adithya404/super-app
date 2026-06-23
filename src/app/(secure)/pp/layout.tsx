/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SidebarSlot } from "@/components/layout/sidebar-slot";
import ChatSidebar from "@/components/pingpal/ChatSidebar";
import CallOverlay from "@/components/pingpal/call/CallOverlay";
import { CallProvider } from "@/components/pingpal/call/call-context";
import IncomingCallDialog from "@/components/pingpal/call/IncomingCallDialog";
import {
  PingPalWSProvider,
  usePingPalWS,
  type WSMessage,
} from "@/components/pingpal/pingpal-ws-context";
import { getMessagePreview } from "@/lib/pingpal/messages";
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
    type?: "text" | "image" | "file" | "system" | "call";
    sender_id: string;
    created_at: string;
    is_deleted?: boolean;
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
      <CallProvider>
        <PingPalLayoutInner userId={userId}>{children}</PingPalLayoutInner>
        <CallOverlay />
        <IncomingCallDialog />
      </CallProvider>
    </PingPalWSProvider>
  );
}

function PingPalLayoutInner({ children, userId }: { children: React.ReactNode; userId: string }) {
  const { data: session } = useSession();
  const userTeams = session?.user?.teams ?? [];
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
            const preview = getMessagePreview(message, userIdRef.current);

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
    <>
      <SidebarSlot>
        <ChatSidebar
          rooms={rooms}
          loading={loadingRooms}
          activeRoomId={activeRoomId}
          currentUserId={userId}
          onRoomsChange={fetchRooms}
          send={send}
          teams={userTeams}
        />
      </SidebarSlot>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </>
  );
}
