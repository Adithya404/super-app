"use client";

import { BookOpenIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KnowledgeResourceListItem } from "@/lib/ai/knowledge-store";
import { formatDateTime } from "@/lib/common/date";
import {
  createKnowledgeResource,
  deleteKnowledgeResource,
  listKnowledgeResources,
} from "../actions";

type KnowledgeBaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KnowledgeBaseDialog({ open, onOpenChange }: KnowledgeBaseDialogProps) {
  const [resources, setResources] = useState<KnowledgeResourceListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, startSave] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const rows = await listKnowledgeResources();
      setResources(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load knowledge base");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadResources();
  }, [open, loadResources]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTitle("");
      setContent("");
      setDeletingId(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error("Content is required");
      return;
    }

    startSave(async () => {
      try {
        const result = await createKnowledgeResource({
          title: title.trim() || undefined,
          content: trimmedContent,
        });
        toast.success(`Added to knowledge base (${result.chunkCount} chunk(s))`);
        setTitle("");
        setContent("");
        await loadResources();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to add resource");
      }
    });
  };

  const handleDelete = (resourceId: string) => {
    setDeletingId(resourceId);
    void (async () => {
      try {
        await deleteKnowledgeResource(resourceId);
        toast.success("Resource deleted");
        await loadResources();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete resource");
      } finally {
        setDeletingId(null);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpenIcon className="size-5" />
            Knowledge base
          </DialogTitle>
          <DialogDescription>
            Add plain-text docs and FAQs Sabre can search during chat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-b px-0 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">Title (optional)</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Refund policy"
              disabled={isSaving}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kb-content">Content</Label>
            <Textarea
              id="kb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste FAQ or documentation text…"
              disabled={isSaving}
              className="min-h-28"
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="submit" disabled={isSaving || !content.trim()}>
              {isSaving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Embedding…
                </>
              ) : (
                "Add to knowledge base"
              )}
            </Button>
          </DialogFooter>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto py-3">
          <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Resources ({resources.length})
          </div>
          {isLoadingList ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Loading…
            </div>
          ) : resources.length === 0 ? (
            <p className="py-6 text-muted-foreground text-sm">
              No resources yet. Add plain text above to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {resources.map((resource) => (
                <li key={resource.resourceId} className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm">
                        {resource.title?.trim() || "Untitled"}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                        {resource.contentPreview}
                      </p>
                      <div className="mt-1.5 text-[11px] text-muted-foreground">
                        {resource.chunkCount} chunk{resource.chunkCount === 1 ? "" : "s"} ·{" "}
                        {formatDateTime(resource.createdAt)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Delete resource"
                      disabled={deletingId === resource.resourceId || isSaving}
                      onClick={() => handleDelete(resource.resourceId)}
                    >
                      {deletingId === resource.resourceId ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
