/** biome-ignore-all lint/a11y/noStaticElementInteractions: dialog backdrop */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: dialog backdrop */
"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
};

type AddMembersDialogProps = {
  open: boolean;
  roomId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
};

export default function AddMembersDialog({
  open,
  roomId,
  existingMemberIds,
  onClose,
  onAdded,
}: AddMembersDialogProps) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected([]);
      setSearchResults([]);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/pingpal/users?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        const users = (data.users ?? []).filter((u: User) => !existingMemberIds.includes(u.id));
        setSearchResults(users);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, existingMemberIds]);

  function toggleMember(user: User) {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  }

  async function handleAdd() {
    if (!selected.length) {
      setError("Select at least one member");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/pingpal/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selected.map((u) => u.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add members");
        return;
      }
      onAdded();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-border border-b px-5 py-4">
          <h2 className="font-semibold text-foreground">Add Members</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5" style={{ maxHeight: "60vh" }}>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pr-1.5 pl-2.5 font-medium text-primary text-xs"
                >
                  {u.name ?? u.email}
                  <button type="button" onClick={() => toggleMember(u)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            {searching ? (
              <Loader2 size={13} className="animate-spin text-muted-foreground" />
            ) : (
              <Search size={13} className="text-muted-foreground" />
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <div className="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
            {searchResults.map((user) => {
              const isSelected = !!selected.find((u) => u.id === user.id);
              return (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => toggleMember(user)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate font-medium text-sm">{user.name ?? user.email}</p>
                    {user.name && (
                      <p className="truncate text-muted-foreground text-xs">{user.email}</p>
                    )}
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {isSelected && <Check size={11} className="text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-foreground text-sm disabled:opacity-50"
            >
              {adding && <Loader2 size={13} className="animate-spin" />}
              Add {selected.length > 0 ? `(${selected.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
