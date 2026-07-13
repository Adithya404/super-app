"use client";

import { ChevronsUpDown, Loader2, MessageCircle, Plus, Search, Users, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Room, WSMessage } from "@/app/(secure)/pp/layout";
import { getMessagePreview } from "@/lib/pingpal/messages";
import { requestNotificationPermission } from "@/lib/pingpal/notifications";
import type { Team } from "@/lib/sidebar/types";
import { getSwitcherTeams, getTeamLandingUrl } from "@/lib/teams";
import { apps } from "../layout/apps/registry";
import { SidebarUserFooter } from "../layout/SidebarUserFooter";

type ChatSidebarProps = {
  rooms: Room[];
  loading: boolean;
  activeRoomId?: string;
  currentUserId: string;
  onRoomsChange: () => void;
  send: (msg: WSMessage) => void;
  teams: Team[];
};

/** Deterministic gradient per room so every conversation gets its own color identity. */
const AVATAR_GRADIENTS = [
  "from-cyan-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-red-600",
  "from-sky-400 to-indigo-600",
] as const;

export function roomGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function ChatSidebar({
  rooms,
  loading,
  activeRoomId,
  currentUserId,
  onRoomsChange,
  send,
  teams,
}: ChatSidebarProps) {
  const router = useRouter();
  const availableTeams = getSwitcherTeams(teams);
  const getAppMeta = (team: Team) => apps.find((app) => app.basePath === team.teamPath);
  const currentTeam = availableTeams.find((team) => team.teamPath === "/pp") ?? availableTeams[0];
  const currentApp = currentTeam ? getAppMeta(currentTeam) : null;

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"dm" | "group">("dm");
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmEmail, setDmEmail] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmError, setDmError] = useState("");
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);

  // Filter rooms by tab and search
  const filtered = rooms.filter((r) => {
    const matchesTab = r.type === tab;
    const preview = r.last_message ? getMessagePreview(r.last_message, currentUserId) : "";
    const matchesSearch =
      !search ||
      r.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      preview.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function handleRoomClick(room: Room) {
    requestNotificationPermission();
    const basePath = room.type === "dm" ? "/pp/messaging/dm" : "/pp/messaging/groups";
    const unreadQuery = room.unread_count > 0 ? `&unread=${room.unread_count}` : "";
    router.push(`${basePath}?roomId=${room.id}${unreadQuery}`);
    send({ type: "join_room", roomId: room.id });
  }

  async function handleStartDM(e: React.FormEvent) {
    e.preventDefault();
    if (!dmEmail.trim()) return;
    setDmLoading(true);
    setDmError("");

    try {
      // Look up user by email
      const userRes = await fetch(`/api/pingpal/users?email=${encodeURIComponent(dmEmail)}`);
      const userData = await userRes.json();
      if (!userData.user) {
        setDmError("No user found with that email");
        return;
      }

      // Find or create DM room
      const res = await fetch("/api/pingpal/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userData.user.id }),
      });
      const data = await res.json();

      if (res.ok) {
        onRoomsChange();
        setShowNewDM(false);
        setDmEmail("");
        router.push(`/pp/messaging/dm?roomId=${data.room.id}`);
      }
    } catch {
      setDmError("Something went wrong");
    } finally {
      setDmLoading(false);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="pp-scene dark flex h-full w-72 shrink-0 flex-col overflow-hidden border-white/10 border-r text-slate-100">
      {/* ── App Switcher (replaces AppShell sidebar) ── */}
      <div className="relative shrink-0 p-2">
        {currentApp && currentTeam ? (
          <button
            type="button"
            onClick={() => setAppDropdownOpen((v) => !v)}
            className="pp-glass flex w-full items-center gap-2 rounded-xl border border-white/10 px-2 py-1.5 font-medium text-slate-200 text-sm transition-colors hover:border-white/20 hover:bg-white/10"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-[10px] text-white shadow-lg"
              style={{ background: currentApp.color }}
            >
              {currentApp.abbr}
            </span>
            <span className="flex-1 truncate text-left text-xs">{currentTeam.name}</span>
            <ChevronsUpDown size={13} className="shrink-0 opacity-40" />
          </button>
        ) : null}

        {appDropdownOpen && (
          <div className="absolute top-full right-2 left-2 z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#12122e]/95 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {availableTeams.map((team) => {
              const app = getAppMeta(team);
              const landingUrl = getTeamLandingUrl(team);
              if (!app || !landingUrl) {
                return null;
              }

              return (
                <button
                  type="button"
                  key={team.teamPath}
                  onClick={() => {
                    setAppDropdownOpen(false);
                    router.push(landingUrl);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/10 ${
                    team.teamPath === "/pp" ? "font-medium text-white" : "text-slate-400"
                  }`}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold text-[9px] text-white"
                    style={{ background: app.color }}
                  >
                    {app.abbr}
                  </span>
                  {team.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand + tabs */}
      <div className="shrink-0 px-4 pt-2 pb-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 shadow-[0_0_18px_rgba(139,92,246,0.5)]">
              <Zap size={15} className="text-white" fill="currentColor" />
            </span>
            <h2 className="pp-brand-text font-bold text-lg tracking-tight">PingPal</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (tab === "dm") setShowNewDM((v) => !v);
              else router.push("/pp/messaging/groups");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-cyan-300 ring-1 ring-white/15 transition-all hover:shadow-[0_0_14px_rgba(103,232,249,0.4)] hover:ring-cyan-300/50"
            title={tab === "dm" ? "New DM" : "New Group"}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* DM/Group tabs — pill capsule */}
        <div className="pp-glass flex rounded-full border border-white/10 p-1">
          <button
            type="button"
            onClick={() => {
              setTab("dm");
              router.push("/pp/messaging/dm");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 font-medium text-xs transition-all ${
              tab === "dm"
                ? "bg-gradient-to-r from-cyan-500/80 to-violet-500/80 text-white shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageCircle size={13} />
            Direct
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("group");
              router.push("/pp/messaging/groups");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 font-medium text-xs transition-all ${
              tab === "group"
                ? "bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80 text-white shadow-[0_0_12px_rgba(232,121,249,0.35)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users size={13} />
            Groups
          </button>
        </div>
      </div>

      {/* New DM form */}
      {showNewDM && tab === "dm" && (
        <form
          onSubmit={handleStartDM}
          className="pp-glass mx-3 mb-2 shrink-0 rounded-2xl border border-white/10 px-4 py-3"
          style={{ animation: "pp-pop 0.25s ease-out" }}
        >
          <p className="mb-2 font-medium text-cyan-200 text-xs">New Direct Message</p>
          <input
            type="email"
            value={dmEmail}
            onChange={(e) => setDmEmail(e.target.value)}
            placeholder="Enter email address..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-slate-100 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
          />
          {dmError && <p className="mt-1 text-rose-400 text-xs">{dmError}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={dmLoading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-1.5 font-medium text-white text-xs transition-all hover:shadow-[0_0_14px_rgba(34,211,238,0.4)] disabled:opacity-50"
            >
              {dmLoading ? <Loader2 size={12} className="animate-spin" /> : "Start Chat"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewDM(false);
                setDmEmail("");
                setDmError("");
              }}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-slate-400 text-xs transition-colors hover:bg-white/10 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="shrink-0 px-3 py-1">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3.5 py-2 transition-colors focus-within:border-cyan-400/40">
          <Search size={13} className="shrink-0 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the cosmos..."
            className="flex-1 bg-transparent text-slate-100 text-sm outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-violet-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/15 ring-1 ring-white/10"
              style={{ animation: "pp-float 4s ease-in-out infinite" }}
            >
              {tab === "dm" ? (
                <MessageCircle size={20} className="text-cyan-300/70" />
              ) : (
                <Users size={20} className="text-fuchsia-300/70" />
              )}
            </div>
            <p className="text-slate-500 text-xs">
              {search
                ? "Nothing found in this galaxy"
                : tab === "dm"
                  ? "No signals received yet"
                  : "No crews assembled yet"}
            </p>
          </div>
        ) : (
          filtered.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                type="button"
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? "bg-white/10 ring-1 ring-white/15"
                    : "hover:bg-white/5 hover:ring-1 hover:ring-white/10"
                }`}
              >
                {/* Active accent beam */}
                {isActive && (
                  <span className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
                )}

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br font-semibold text-sm text-white shadow-lg ${roomGradient(room.id)}`}
                  >
                    {room.avatar_url ? (
                      <Image
                        src={room.avatar_url}
                        alt={room.display_name ?? "User"}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : room.type === "group" ? (
                      <Users size={16} />
                    ) : (
                      (room.display_name ?? "?").charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Unread badge */}
                  {room.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-1 font-bold text-[10px] text-white shadow-[0_0_8px_rgba(232,121,249,0.6)]">
                      {room.unread_count > 99 ? "99+" : room.unread_count}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p
                      className={`truncate text-sm ${
                        room.unread_count > 0
                          ? "font-semibold text-white"
                          : "font-medium text-slate-200"
                      }`}
                    >
                      {room.display_name ?? "Direct Message"}
                    </p>
                    {room.last_message && (
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {formatTime(room.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`truncate text-xs ${
                      room.unread_count > 0 ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {getMessagePreview(room.last_message, currentUserId)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <SidebarUserFooter variant="dark" className="border-white/10" />
    </div>
  );
}
