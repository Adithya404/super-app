"use client";

import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Team } from "@/lib/sidebar/types";
import { getFirstAccessiblePath } from "@/lib/teams";

export function TeamSwitcher({
  teams,
  activeTeam,
  setActiveTeam,
}: {
  teams: Team[];
  activeTeam: Team;
  setActiveTeam: (team: Team) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex w-full items-center justify-between gap-2 border-white/10 bg-white/5 px-2 py-1.5 font-medium text-sm text-white transition-colors hover:bg-white/10 hover:text-white"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary font-bold text-[10px] text-primary-foreground">
              {activeTeam.logo}
            </span>
            <span className="truncate">{activeTeam.name}</span>
          </div>
          <ChevronsUpDown size={14} className="shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Applications
        </DropdownMenuLabel>
        {teams.map((team) => (
          <TeamSwitcherItem key={team.name} team={team} setActiveTeam={setActiveTeam} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeamSwitcherItem({
  team,
  setActiveTeam,
}: {
  team: Team;
  setActiveTeam: (team: Team) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const url = getFirstAccessiblePath([team]) || team.teamPath;

  return (
    <DropdownMenuItem
      onClick={() => {
        setActiveTeam(team);
        startTransition(() => {
          router.push(url);
        });
      }}
      className="cursor-pointer gap-2 p-2"
    >
      <div className="flex size-5 items-center justify-center rounded-sm bg-muted/50 font-bold text-[10px]">
        {isPending ? <Loader2 className="size-3 animate-spin" /> : team.logo}
      </div>
      <span className="truncate">{team.name}</span>
    </DropdownMenuItem>
  );
}
