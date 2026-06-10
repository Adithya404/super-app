/** biome-ignore-all lint/a11y/noStaticElementInteractions: dialog backdrop */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: dialog backdrop */
"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Room } from "@/app/(secure)/pp/layout";

type GroupSettingsDialogProps = {
  open: boolean;
  room: Room;
  onClose: () => void;
  onSaved: (room: Room) => void;
};

export default function GroupSettingsDialog({
  open,
  room,
  onClose,
  onSaved,
}: GroupSettingsDialogProps) {
  const [name, setName] = useState(room.display_name ?? "");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(room.display_name ?? "");
      setDescription((room as Room & { description?: string }).description ?? "");
      setError("");
    }
  }, [open, room]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/pingpal/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }
      onSaved({ ...room, display_name: data.room.name, ...data.room });
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-border border-b px-5 py-4">
          <h2 className="font-semibold text-foreground">Group Settings</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <label htmlFor="settings-name" className="font-medium text-xs">
              Group Name
            </label>
            <input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="settings-description" className="font-medium text-xs">
              Description
            </label>
            <textarea
              id="settings-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
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
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-foreground text-sm disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
