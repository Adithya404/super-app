"use client";

import * as React from "react";
import type { Team } from "@/lib/sidebar/types";

type TeamContextType = {
  teams: Team[];
  activeTeam: Team | null;
  setActiveTeam: (team: Team) => void;
};

const TeamContext = React.createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ teams, children }: { teams: Team[]; children: React.ReactNode }) {
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(
    teams.length > 0 ? teams[0] : null,
  );

  return (
    <TeamContext.Provider value={{ teams, activeTeam, setActiveTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = React.useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeamContext must be used within a TeamProvider");
  }
  return context;
}
