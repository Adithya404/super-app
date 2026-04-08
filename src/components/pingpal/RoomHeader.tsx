"use client";

import { LogOut, MoreVertical, Settings, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { Room } from "@/app/(secure)/pp/layout";

type RoomMember = {
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_online: boolean;
  role: "owner" | "admin" | "member";
};

type RoomHeaderProps = {
  room: Room;
  currentUserId: string;
  isGroup?: boolean;
};

export default function RoomHeader({ room, currentUserId, isGroup }: RoomHeaderProps) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    fetch(`/api/pingpal/rooms/${room.id}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []));
  }, [room.id]);

  const onlineCount = members.filter((m) => m.is_online).length;
  const isOwnerOrAdmin = ["owner", "admin"].includes(room.role);

  // For DMs, show the other person's name
  const dmPartner = !isGroup ? members.find((m) => m.user_id !== currentUserId) : null;

  const displayName = isGroup
    ? room.name
    : (dmPartner?.name ?? dmPartner?.email ?? "Direct Message");
  const subtitle = isGroup
    ? `${members.length} members · ${onlineCount} online`
    : dmPartner?.is_online
      ? "Online"
      : "Offline";

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-border border-b bg-background px-4">
      {/* Left — room info */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
            {isGroup ? <Users size={16} /> : (displayName?.charAt(0) ?? "?").toUpperCase()}
          </div>
          {/* Online dot — DMs only */}
          {!isGroup && dmPartner?.is_online && (
            <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>

        {/* Name + subtitle */}
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground text-sm">{displayName}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Members list toggle — groups only */}
        {isGroup && (
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Members"
          >
            <Users size={16} />
          </button>
        )}

        {/* More actions */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute top-9 right-0 z-20 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
              {/* Owner/admin only actions */}
              {isGroup && isOwnerOrAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-foreground text-sm transition-colors hover:bg-muted"
                  >
                    <UserPlus size={14} className="text-muted-foreground" />
                    Add Members
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-foreground text-sm transition-colors hover:bg-muted"
                  >
                    <Settings size={14} className="text-muted-foreground" />
                    Group Settings
                  </button>
                  <div className="my-1 border-border border-t" />
                </>
              )}

              {/* All members */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-destructive text-sm transition-colors hover:bg-destructive/5"
              >
                <LogOut size={14} />
                {isGroup ? "Leave Group" : "Delete Conversation"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Members panel — slides in from right */}
      {isGroup && showMembers && (
        <div className="absolute top-14 right-0 bottom-0 z-10 w-64 overflow-y-auto border-border border-l bg-background">
          <div className="border-border border-b px-4 py-3">
            <p className="font-medium text-foreground text-sm">Members ({members.length})</p>
          </div>
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted"
            >
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                  {(m.name ?? m.email).charAt(0).toUpperCase()}
                </div>
                {m.is_online && (
                  <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground text-sm">{m.name ?? m.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
