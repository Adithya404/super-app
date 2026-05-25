import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFirstAccessiblePath } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/home");
  }

  const teams = session.user?.teams ?? [];

  if (teams.length === 0) {
    redirect("/no-access");
  }

  const firstPath = getFirstAccessiblePath(teams);

  if (firstPath) {
    redirect(firstPath);
  } else {
    redirect("/no-access");
  }
}
