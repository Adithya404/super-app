"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  ShareIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { useBreadcrumbTrail } from "@/components/layout/breadcrumb-trail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { ChatListItem, ChatVisibility } from "@/lib/ai/chat-store";
import { cn } from "@/lib/utils";
import {
  deleteChatSession,
  renameChatSession,
  setChatSessionVisibility,
  toggleChatFavorite,
} from "../actions";
import { chatHistoryPageUrl } from "../chat-history-keys";

type ChatHistoryPage = {
  chats: ChatListItem[];
  hasMore: boolean;
};

type GroupedChats = {
  favorites: ChatListItem[];
  today: ChatListItem[];
  yesterday: ChatListItem[];
  lastWeek: ChatListItem[];
  lastMonth: ChatListItem[];
  older: ChatListItem[];
};

async function fetchHistory(url: string): Promise<ChatHistoryPage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load chat history");
  }
  return response.json() as Promise<ChatHistoryPage>;
}

function getHistoryKey(pageIndex: number, previousPageData: ChatHistoryPage | null) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) {
    return chatHistoryPageUrl();
  }

  const lastChat = previousPageData?.chats.at(-1);
  if (!lastChat) {
    return null;
  }

  return chatHistoryPageUrl(lastChat.chatId);
}

function groupChatsByDate(chats: ChatListItem[]): GroupedChats {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce<GroupedChats>(
    (groups, chat) => {
      if (chat.isFavorite) {
        groups.favorites.push(chat);
        return groups;
      }

      const chatDate = new Date(chat.updatedAt);
      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      favorites: [],
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    },
  );
}

function ChatHistoryGroup({
  label,
  chats,
  activeChatId,
  onRename,
  onToggleFavorite,
  onSetVisibility,
  onDelete,
}: {
  label: string;
  chats: ChatListItem[];
  activeChatId: string | null;
  onRename: (chat: ChatListItem) => void;
  onToggleFavorite: (chat: ChatListItem) => void;
  onSetVisibility: (chat: ChatListItem, visibility: ChatVisibility) => void;
  onDelete: (chat: ChatListItem) => void;
}) {
  if (chats.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="px-3.5 pt-3 pb-1 font-semibold text-[10px] text-white/40 uppercase tracking-widest">
        {label}
      </div>
      <ul>
        {chats.map((chat) => {
          const isActive = chat.chatId === activeChatId;
          const href = `/sb/config/chat/${chat.chatId}`;
          const title = chat.title?.trim() || "New chat";

          return (
            <li key={chat.chatId} className="group relative">
              <Link
                href={href}
                className={cn(
                  "flex items-center border-l-2 py-1.5 pr-8 pl-5 text-[13px] transition-all",
                  isActive
                    ? "border-primary bg-white/10 font-medium text-white"
                    : "border-transparent text-[#9ba3b2] hover:bg-white/6 hover:text-white",
                )}
                title={title}
              >
                <span className="truncate">{title}</span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-0.5 right-1 h-7 w-7 bg-transparent text-[#9ba3b2] opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100 data-[state=open]:opacity-100",
                      isActive && "opacity-100",
                    )}
                    aria-label="Chat actions"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ShareIcon className="size-4" />
                      Share
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={() => onSetVisibility(chat, "private")}>
                        Private{chat.visibility === "private" ? " ✓" : ""}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onSetVisibility(chat, "public")}>
                        Public{chat.visibility === "public" ? " ✓" : ""}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={async () => {
                          const url = `${window.location.origin}${href}`;
                          await navigator.clipboard.writeText(url);
                        }}
                      >
                        Copy link
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onSelect={() => onToggleFavorite(chat)}>
                    <StarIcon className="size-4" />
                    {chat.isFavorite ? "Unfavorite" : "Favorite"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onRename(chat)}>
                    <PencilIcon className="size-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(chat)}>
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Scrollable chat history panel for embedding in the main app sidebar. */
export function ChatHistoryPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTrailSegment, trailSegment } = useBreadcrumbTrail();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const activeChatId = useMemo(() => {
    const match = pathname.match(/^\/sb\/config\/chat\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [pathname]);

  const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<ChatHistoryPage>(
    getHistoryKey,
    fetchHistory,
    {
      revalidateFirstPage: true,
      revalidateOnFocus: false,
    },
  );

  const chats = useMemo(() => data?.flatMap((page) => page.chats) ?? [], [data]);
  const hasMore = data?.at(-1)?.hasMore ?? false;
  const grouped = useMemo(() => groupChatsByDate(chats), [chats]);

  const [renameChat, setRenameChat] = useState<ChatListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatListItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isValidating) {
          void setSize(size + 1);
        }
      },
      { rootMargin: "80px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isValidating, setSize, size]);

  const handleRename = useCallback((chat: ChatListItem) => {
    setRenameChat(chat);
    setRenameValue(chat.title ?? "");
  }, []);

  const handleToggleFavorite = useCallback(
    async (chat: ChatListItem) => {
      await toggleChatFavorite(chat.chatId, !chat.isFavorite);
      await mutate();
    },
    [mutate],
  );

  const handleSetVisibility = useCallback(
    async (chat: ChatListItem, visibility: ChatVisibility) => {
      await setChatSessionVisibility(chat.chatId, visibility);
      await mutate();
    },
    [mutate],
  );

  const handleConfirmRename = async () => {
    if (!renameChat || !renameValue.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const nextTitle = renameValue.trim();
      await renameChatSession(renameChat.chatId, nextTitle);
      if (renameChat.chatId === activeChatId) {
        setTrailSegment(nextTitle);
      }
      setRenameChat(null);
      await mutate();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsSaving(true);
    try {
      const deletedId = deleteTarget.chatId;
      await deleteChatSession(deletedId);
      setDeleteTarget(null);
      if (deletedId === activeChatId) {
        setTrailSegment(null);
        router.push("/sb/config/chat");
      }
      await mutate();
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!activeChatId) {
      return;
    }
    const active = chats.find((chat) => chat.chatId === activeChatId);
    if (active?.title && active.title !== trailSegment) {
      setTrailSegment(active.title);
    }
  }, [activeChatId, chats, setTrailSegment, trailSegment]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="scrollbar-thin scrollbar-thumb-white/10 no-scrollbar min-h-0 flex-1 overflow-y-auto py-1">
        {isLoading && chats.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-3 text-[#9ba3b2] text-sm">
            <Loader2Icon className="size-4 animate-spin" />
            Loading Chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="px-5 py-3 text-[#9ba3b2] text-sm">
            Your conversations will appear here once you start chatting.
          </div>
        ) : (
          <>
            <ChatHistoryGroup
              label="Favorites"
              chats={grouped.favorites}
              activeChatId={activeChatId}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onSetVisibility={handleSetVisibility}
              onDelete={setDeleteTarget}
            />
            <ChatHistoryGroup
              label="Today"
              chats={grouped.today}
              activeChatId={activeChatId}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onSetVisibility={handleSetVisibility}
              onDelete={setDeleteTarget}
            />
            <ChatHistoryGroup
              label="Yesterday"
              chats={grouped.yesterday}
              activeChatId={activeChatId}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onSetVisibility={handleSetVisibility}
              onDelete={setDeleteTarget}
            />
            <ChatHistoryGroup
              label="Last 7 Days"
              chats={grouped.lastWeek}
              activeChatId={activeChatId}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onSetVisibility={handleSetVisibility}
              onDelete={setDeleteTarget}
            />
            <ChatHistoryGroup
              label="Last 30 Days"
              chats={grouped.lastMonth}
              activeChatId={activeChatId}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onSetVisibility={handleSetVisibility}
              onDelete={setDeleteTarget}
            />
            <ChatHistoryGroup
              label="Older"
              chats={grouped.older}
              activeChatId={activeChatId}
              onRename={handleRename}
              onToggleFavorite={handleToggleFavorite}
              onSetVisibility={handleSetVisibility}
              onDelete={setDeleteTarget}
            />
          </>
        )}

        <div ref={sentinelRef} className="h-4" />

        {isValidating && hasMore ? (
          <div className="flex items-center gap-2 px-5 py-2 text-[#9ba3b2] text-sm">
            <Loader2Icon className="size-4 animate-spin" />
            Loading Chats...
          </div>
        ) : null}
      </div>

      <Dialog open={renameChat != null} onOpenChange={(open) => !open && setRenameChat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.currentTarget.value)}
            placeholder="Chat title"
            maxLength={100}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameChat(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving || !renameValue.trim()}
              onClick={() => void handleConfirmRename()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversation and its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** @deprecated Use ChatHistoryPanel — kept as alias for older imports */
export const ChatSidebar = ChatHistoryPanel;
