"use client";

import { ChevronsUpDown, Loader2, MessageCircle, Plus, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Room, WSMessage } from "@/app/(secure)/pp/layout";
import type { AppConfig } from "../layout/apps";

type ChatSidebarProps = {
  rooms: Room[];
  loading: boolean;
  activeRoomId?: string;
  currentUserId: string;
  onRoomsChange: () => void;
  send: (msg: WSMessage) => void;
  apps: AppConfig[];
};

export default function ChatSidebar({
  rooms,
  loading,
  activeRoomId,
  // currentUserId,
  onRoomsChange,
  send,
  apps,
}: ChatSidebarProps) {
  const router = useRouter();
  // const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"dm" | "group">("dm");
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmEmail, setDmEmail] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmError, setDmError] = useState("");
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const currentApp = apps.find((a) => a.key === "pingpal") ?? apps[0];
  // const isDMPage = pathname.includes("/dm");

  // Filter rooms by tab and search
  const filtered = rooms.filter((r) => {
    const matchesTab = r.type === tab;
    const matchesSearch =
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.last_message?.content?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function handleRoomClick(room: Room) {
    const basePath = room.type === "dm" ? "/pp/messaging/dm" : "/pp/messaging/groups";
    router.push(`${basePath}?roomId=${room.id}`);
    // Tell WS server we're in this room
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
        router.push(`/pingpal/messaging/dm?roomId=${data.room.id}`);
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
    <div className="flex w-72 shrink-0 flex-col overflow-hidden border-border border-r bg-background">
      {/* Header */}
      {/* ── App Switcher (replaces AppShell sidebar) ── */}
      <div className="relative border-border border-b p-2">
        <button
          type="button"
          onClick={() => setAppDropdownOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-md bg-muted px-2 py-1.5 font-medium text-sm transition-colors hover:bg-muted/80"
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-bold text-[10px] text-white"
            style={{ background: currentApp.color }}
          >
            {currentApp.abbr}
          </span>
          <span className="flex-1 truncate text-left text-xs">{currentApp.name}</span>
          <ChevronsUpDown size={13} className="shrink-0 opacity-40" />
        </button>

        {appDropdownOpen && (
          <div className="absolute top-full right-2 left-2 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg">
            {apps.map((app) => (
              <button
                type="button"
                key={app.key}
                onClick={() => {
                  setAppDropdownOpen(false);
                  router.push(`${app.basePath}`);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted ${
                  app.key === "pingpal" ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold text-[9px] text-white"
                  style={{ background: app.color }}
                >
                  {app.abbr}
                </span>
                {app.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 border-border border-b px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">PingPal</h2>
          <button
            type="button"
            onClick={() => {
              if (tab === "dm") setShowNewDM((v) => !v);
              else router.push("/pp/messaging/groups");
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={tab === "dm" ? "New DM" : "New Group"}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* DM/Group tabs */}
        <div className="flex rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => {
              setTab("dm");
              router.push("/pp/messaging/dm");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium text-xs transition-colors ${
              tab === "dm"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium text-xs transition-colors ${
              tab === "group"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
          className="shrink-0 border-border border-b bg-muted/30 px-4 py-3"
        >
          <p className="mb-2 font-medium text-foreground text-xs">New Direct Message</p>
          <input
            type="email"
            value={dmEmail}
            onChange={(e) => setDmEmail(e.target.value)}
            placeholder="Enter email address..."
            // autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-foreground text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
          />
          {dmError && <p className="mt-1 text-destructive text-xs">{dmError}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={dmLoading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 font-medium text-primary-foreground text-xs transition-opacity hover:opacity-90 disabled:opacity-50"
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
              className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="shrink-0 px-4 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <Search size={13} className="shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {tab === "dm" ? (
                <MessageCircle size={18} className="text-muted-foreground" />
              ) : (
                <Users size={18} className="text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {search
                ? "No results found"
                : tab === "dm"
                  ? "No direct messages yet"
                  : "No groups yet"}
            </p>
          </div>
        ) : (
          filtered.map((room) => (
            <button
              type="button"
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                room.id === activeRoomId ? "bg-muted" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                  {room.type === "group" ? (
                    <Users size={16} />
                  ) : (
                    (room.name ?? "?").charAt(0).toUpperCase()
                  )}
                </div>
                {/* Unread badge */}
                {room.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-semibold text-[10px] text-primary-foreground">
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
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground"
                    }`}
                  >
                    {room.name ?? "Direct Message"}
                  </p>
                  {room.last_message && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatTime(room.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p
                  className={`truncate text-xs ${
                    room.unread_count > 0 ? "text-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {room.last_message?.content ?? "No messages yet"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
