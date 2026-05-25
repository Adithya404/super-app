import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/roles";
import type { Team } from "@/lib/sidebar/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: UserRole[];
      teams: Team[];
    } & DefaultSession["user"];
  }
}
