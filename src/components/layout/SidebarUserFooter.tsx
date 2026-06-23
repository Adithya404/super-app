"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarUserFooterProps = {
  variant?: "dark" | "light";
  className?: string;
};

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SidebarUserFooter({ variant = "light", className }: SidebarUserFooterProps) {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "shrink-0 border-t p-2",
        isDark ? "border-white/8" : "border-border",
        className,
      )}
    >
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
          <AvatarFallback className="bg-primary font-semibold text-[11px] text-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium text-[12px]",
              isDark ? "text-[#e2e5ec]" : "text-foreground",
            )}
          >
            {user.name ?? "User"}
          </p>
          <p
            className={cn(
              "truncate text-[11px]",
              isDark ? "text-[#9ba3b2]" : "text-muted-foreground",
            )}
          >
            {user.email}
          </p>
        </div>

        <Button
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className={cn(
            "h-8 w-8 rounded-full bg-transparent",
            isDark
              ? "text-[#9ba3b2] hover:bg-white/10 hover:text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title="Sign out"
          size="icon"
          variant="ghost"
        >
          <LogOut size={14} />
        </Button>
      </div>
    </div>
  );
}
