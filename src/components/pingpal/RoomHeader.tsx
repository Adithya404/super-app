"use client";

import { LogOut, MoreVertical, Phone, Settings, UserPlus, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Room } from "@/app/(secure)/pp/layout";
import { roomGradient } from "@/components/pingpal/ChatSidebar";
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
      <div className="pp-glass relative flex h-14 shrink-0 items-center justify-between border-white/10 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br font-semibold text-sm text-white shadow-lg ${roomGradient(room.id)}`}
            >
              {isGroup ? <Users size={16} /> : (displayName?.charAt(0) ?? "?").toUpperCase()}
            </div>
            {!isGroup && dmPartner?.is_online && (
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] ring-2 ring-[#0b0b26]" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-100 text-sm">{displayName}</p>
            <p
              className={`text-[11px] ${
                !isGroup && dmPartner?.is_online ? "text-emerald-300" : "text-slate-500"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isGroup && dmPartner && (
            <>
              <button
                type="button"
                onClick={() => void handleStartCall("audio")}
                disabled={call.status !== "idle" || startingCall !== null}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-emerald-300 disabled:opacity-50"
                title="Audio call"
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                onClick={() => void handleStartCall("video")}
                disabled={call.status !== "idle" || startingCall !== null}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-cyan-300 disabled:opacity-50"
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
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-fuchsia-300"
              title="Members"
            >
              <Users size={16} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute top-9 right-0 z-20 w-48 rounded-xl border border-white/10 bg-[#12122e]/95 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
                {isGroup && isOwnerOrAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowAddMembers(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-slate-200 text-sm hover:bg-white/10"
                    >
                      <UserPlus size={14} className="text-slate-400" />
                      Add Members
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowSettings(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-slate-200 text-sm hover:bg-white/10"
                    >
                      <Settings size={14} className="text-slate-400" />
                      Group Settings
                    </button>
                    <div className="my-1 border-white/10 border-t" />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-rose-400 text-sm hover:bg-rose-500/10 disabled:opacity-50"
                >
                  <LogOut size={14} />
                  {isGroup ? "Leave Group" : "Delete Conversation"}
                </button>
              </div>
            )}
          </div>
        </div>

        {isGroup && showMembers && (
          <div className="absolute top-14 right-0 bottom-0 z-10 w-64 overflow-y-auto border-white/10 border-l bg-[#0e0e2a]/95 backdrop-blur-xl">
            <div className="border-white/10 border-b px-4 py-3">
              <p className="font-medium text-slate-100 text-sm">Members ({members.length})</p>
            </div>
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5">
                <div className="relative shrink-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br font-semibold text-white text-xs shadow-md ${roomGradient(m.user_id)}`}
                  >
                    {(m.name ?? m.email).charAt(0).toUpperCase()}
                  </div>
                  {m.is_online && (
                    <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] ring-1 ring-[#0e0e2a]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-100 text-sm">{m.name ?? m.email}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{m.role}</p>
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
