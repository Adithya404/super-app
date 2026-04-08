import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email"); // exact email lookup — used by ChatSidebar new DM
  const q = searchParams.get("q"); // fuzzy search — used by CreateGroupDialog
  const ids = searchParams.get("ids"); // comma-separated ids — used by ChatWindow sender names

  // ── Exact email lookup ─────────────────────────────────────────
  if (email) {
    const { rows } = await pingpalPool.query(
      `SELECT id, email, name, avatar_url, is_online
       FROM pingpal.users
       WHERE email = $1
         AND id != $2`,
      [email, session.user.id],
    );

    if (!rows.length) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  }

  // ── Fuzzy search by name or email ──────────────────────────────
  if (q) {
    const term = `%${q.toLowerCase()}%`;

    const { rows } = await pingpalPool.query(
      `SELECT id, email, name, avatar_url, is_online
       FROM pingpal.users
       WHERE (LOWER(email) LIKE $1 OR LOWER(COALESCE(name, '')) LIKE $1)
         AND id != $2
       ORDER BY name ASC NULLS LAST
       LIMIT 20`,
      [term, session.user.id],
    );

    return NextResponse.json({ users: rows });
  }

  // ── Bulk fetch by ids ──────────────────────────────────────────
  if (ids) {
    const idList = ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!idList.length) {
      return NextResponse.json({ users: [] });
    }

    // Build $1, $2, $3 ... placeholders
    const placeholders = idList.map((_, i) => `$${i + 1}`).join(", ");

    const { rows } = await pingpalPool.query(
      `SELECT id, email, name, avatar_url, is_online
       FROM pingpal.users
       WHERE id IN (${placeholders})`,
      idList,
    );

    return NextResponse.json({ users: rows });
  }

  // ── No params — return all users except self (for admin/debug) ─
  const { rows } = await pingpalPool.query(
    `SELECT id, email, name, avatar_url, is_online
     FROM pingpal.users
     WHERE id != $1
     ORDER BY name ASC NULLS LAST
     LIMIT 50`,
    [session.user.id],
  );

  return NextResponse.json({ users: rows });
}
