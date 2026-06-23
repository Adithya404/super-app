"use client";

import { LogOut, MoreVertical, Phone, Settings, UserPlus, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Room } from "@/app/(secure)/pp/layout";
import { useCall } from "@/components/pingpal/call/call-context";
import AddMembersDialog from "./AddMembersDialog";
import GroupSettingsDialog from "./GroupSettingsDialog";

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
  onRoomUpdate?: (room: Room) => void;
};

export default function RoomHeader({
  room,
  currentUserId,
  isGroup,
  onRoomUpdate,
}: RoomHeaderProps) {
  const router = useRouter();
  const { startCall, call } = useCall();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [startingCall, setStartingCall] = useState<"audio" | "video" | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchMembers = useCallback(() => {
    fetch(`/api/pingpal/rooms/${room.id}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []));
  }, [room.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onlineCount = members.filter((m) => m.is_online).length;
  const isOwnerOrAdmin = ["owner", "admin"].includes(room.role);
  const dmPartner = !isGroup ? members.find((m) => m.user_id !== currentUserId) : null;
  const groupName = room.display_name ?? (room as Room & { name?: string }).name ?? "Group";

  const displayName = isGroup
    ? groupName
    : (dmPartner?.name ?? dmPartner?.email ?? "Direct Message");
  const subtitle = isGroup
    ? `${members.length} members · ${onlineCount} online`
    : dmPartner?.is_online
      ? "Online"
      : "Offline";

  async function handleStartCall(callType: "audio" | "video") {
    if (isGroup || !dmPartner || call.status !== "idle") return;
    setStartingCall(callType);
    try {
      await startCall({
        roomId: room.id,
        toUserId: dmPartner.user_id,
        remoteUserName: dmPartner.name ?? dmPartner.email,
        callType,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
    } finally {
      setStartingCall(null);
    }
  }

  async function handleLeave() {
    if (!confirm(isGroup ? "Leave this group?" : "Delete this conversation?")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/pingpal/rooms/${room.id}/members`, { method: "DELETE" });
      if (res.ok) {
        router.push(isGroup ? "/pp/messaging/groups" : "/pp/messaging/dm");
      }
    } finally {
      setLeaving(false);
      setShowMenu(false);
    }
  }

  return (
    <>
      <div className="relative flex h-14 shrink-0 items-center justify-between border-border border-b bg-background px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
              {isGroup ? <Users size={16} /> : (displayName?.charAt(0) ?? "?").toUpperCase()}
            </div>
            {!isGroup && dmPartner?.is_online && (
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-foreground text-sm">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isGroup && dmPartner && (
            <>
              <button
                type="button"
                onClick={() => void handleStartCall("audio")}
                disabled={call.status !== "idle" || startingCall !== null}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                title="Audio call"
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                onClick={() => void handleStartCall("video")}
                disabled={call.status !== "idle" || startingCall !== null}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                title="Video call"
              >
                <Video size={16} />
              </button>
            </>
          )}

          {isGroup && (
            <button
              type="button"
              onClick={() => setShowMembers((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Members"
            >
              <Users size={16} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute top-9 right-0 z-20 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                {isGroup && isOwnerOrAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowAddMembers(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-foreground text-sm hover:bg-muted"
                    >
                      <UserPlus size={14} className="text-muted-foreground" />
                      Add Members
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowSettings(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-foreground text-sm hover:bg-muted"
                    >
                      <Settings size={14} className="text-muted-foreground" />
                      Group Settings
                    </button>
                    <div className="my-1 border-border border-t" />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-destructive text-sm hover:bg-destructive/5 disabled:opacity-50"
                >
                  <LogOut size={14} />
                  {isGroup ? "Leave Group" : "Delete Conversation"}
                </button>
              </div>
            )}
          </div>
        </div>

        {isGroup && showMembers && (
          <div className="absolute top-14 right-0 bottom-0 z-10 w-64 overflow-y-auto border-border border-l bg-background">
            <div className="border-border border-b px-4 py-3">
              <p className="font-medium text-foreground text-sm">Members ({members.length})</p>
            </div>
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted">
                <div className="relative shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                    {(m.name ?? m.email).charAt(0).toUpperCase()}
                  </div>
                  {m.is_online && (
                    <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground text-sm">
                    {m.name ?? m.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isGroup && (
        <>
          <AddMembersDialog
            open={showAddMembers}
            roomId={room.id}
            existingMemberIds={members.map((m) => m.user_id)}
            onClose={() => setShowAddMembers(false)}
            onAdded={fetchMembers}
          />
          <GroupSettingsDialog
            open={showSettings}
            room={room}
            onClose={() => setShowSettings(false)}
            onSaved={(updated) => onRoomUpdate?.(updated)}
          />
        </>
      )}
    </>
  );
}
