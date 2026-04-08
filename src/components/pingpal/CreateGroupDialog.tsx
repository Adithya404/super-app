/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <later> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <later> */
"use client";

import { Check, Loader2, Search, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
};

type CreateGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: <later>
  onCreated: (room: any) => void;
};

export default function CreateGroupDialog({ open, onClose, onCreated }: CreateGroupDialogProps) {
  const [step, setStep] = useState<"details" | "members">("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("details");
        setName("");
        setDescription("");
        setSearch("");
        setSelected([]);
        setError("");
      }, 200);
    }
  }, [open]);

  // Search users by email/name
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
        setSearchResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function toggleMember(user: User) {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/pingpal/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          memberIds: selected.map((u) => u.id),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create group");
        return;
      }

      onCreated(data.room);
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Create Group</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {step === "details" ? "Step 1 of 2 — Group details" : "Step 2 of 2 — Add members"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* Step 1 — Details */}
        {step === "details" && (
          <div className="space-y-4 px-5 py-5">
            {/* Group icon preview */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users size={28} className="text-primary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="group-name" className="font-medium text-foreground text-xs">
                Group Name *
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Alpha"
                maxLength={60}
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="font-medium text-foreground text-xs">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this group about?"
                rows={3}
                maxLength={200}
                className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border py-2 text-muted-foreground text-sm transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    setError("Group name is required");
                    return;
                  }
                  setError("");
                  setStep("members");
                }}
                className="flex-1 rounded-lg bg-primary py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Members */}
        {step === "members" && (
          <div className="flex flex-col gap-4 px-5 py-5" style={{ maxHeight: "60vh" }}>
            {/* Selected members */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pr-1.5 pl-2.5 font-medium text-primary text-xs"
                  >
                    {u.name ?? u.email}
                    <button
                      type="button"
                      onClick={() => toggleMember(u)}
                      className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              {searching ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search size={13} className="shrink-0 text-muted-foreground" />
              )}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Results */}
            <div className="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
              {searchResults.length === 0 && search.trim() && !searching && (
                <p className="py-4 text-center text-muted-foreground text-xs">No users found</p>
              )}
              {searchResults.map((user) => {
                const isSelected = !!selected.find((u) => u.id === user.id);
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => toggleMember(user)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                      {(user.name ?? user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-medium text-foreground text-sm">
                        {user.name ?? user.email}
                      </p>
                      {user.name && (
                        <p className="truncate text-muted-foreground text-xs">{user.email}</p>
                      )}
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected ? "border-primary bg-primary" : "border-border bg-transparent"
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
                onClick={() => setStep("details")}
                className="flex-1 rounded-lg border border-border py-2 text-muted-foreground text-sm transition-colors hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {creating && <Loader2 size={13} className="animate-spin" />}
                {creating
                  ? "Creating..."
                  : `Create Group${selected.length > 0 ? ` (${selected.length})` : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
