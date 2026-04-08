/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { apps } from "@/components/layout/apps/registry";
import ChatSidebar from "@/components/pingpal/ChatSidebar";
import { useWebSocket } from "@/hooks/useWebSocket";

export type Room = {
  id: string;
  name: string | null;
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

export type WSMessage = {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: <later>
  [key: string]: any;
};

type PingPalLayoutProps = {
  children: React.ReactNode;
  activeRoomId?: string;
};

export default function PingPalLayout({ children }: PingPalLayoutProps) {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const searchParams = useSearchParams();
  const activeRoomId = searchParams.get("roomId") ?? undefined;

  // Fetch all rooms for the current user
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

  // Handle incoming WebSocket messages at layout level
  // so the room list stays live across all pages
  const handleWSMessage = useCallback(
    (msg: WSMessage) => {
      switch (msg.type) {
        case "new_message": {
          // Update last_message and bump unread count for that room
          setRooms((prev) =>
            prev
              .map((r) =>
                r.id === msg.message.room_id
                  ? {
                      ...r,
                      last_message: msg.message,
                      updated_at: msg.message.created_at,
                      unread_count:
                        r.id === activeRoomId
                          ? 0 // already viewing this room
                          : r.unread_count + 1,
                    }
                  : r,
              )
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
          );
          break;
        }

        case "room_created": {
          // New room appeared (e.g. someone added you to a group)
          setRooms((prev) => [msg.room, ...prev]);
          break;
        }

        case "room_updated": {
          setRooms((prev) => prev.map((r) => (r.id === msg.room.id ? { ...r, ...msg.room } : r)));
          break;
        }
      }
    },
    [activeRoomId],
  );

  const { send } = useWebSocket(session?.user?.id ?? "", handleWSMessage);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Rooms sidebar */}
      <ChatSidebar
        rooms={rooms}
        loading={loadingRooms}
        activeRoomId={activeRoomId}
        currentUserId={session?.user?.id ?? ""}
        onRoomsChange={fetchRooms}
        send={send}
        apps={apps}
      />

      {/* Page content — DM or Group chat window */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
