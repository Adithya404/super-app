import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pingpalPool } from "@/lib/db";
import { verifyChatAccess } from "@/lib/pingpal/permissions";

const baseSelect = `
  SELECT u.id, u.email, u.name, u.image as avatar_url, COALESCE(up.is_online, false) as is_online
  FROM super.users u
  JOIN super.user_roles ur ON ur.email = u.email
  LEFT JOIN pingpal.user_presence up ON up.user_id = u.id
`;

const baseWhere = `
  ur.role_code IN ('chat_personnel', 'chat_master')
  AND (ur.end_date IS NULL OR ur.end_date > CURRENT_DATE)
`;

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasAccess } = await verifyChatAccess(session.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email"); // exact email lookup
  const q = searchParams.get("q"); // fuzzy search
  const ids = searchParams.get("ids"); // comma-separated ids

  if (email) {
    const { rows } = await pingpalPool.query(
      `${baseSelect}
       WHERE ${baseWhere}
         AND u.email = $1
         AND u.id != $2`,
      [email, session.user.id],
    );

    if (!rows.length) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  }

  if (q) {
    const term = `%${q.toLowerCase()}%`;

    const { rows } = await pingpalPool.query(
      `${baseSelect}
       WHERE ${baseWhere}
         AND (LOWER(u.email) LIKE $1 OR LOWER(COALESCE(u.name, '')) LIKE $1)
         AND u.id != $2
       ORDER BY u.name ASC NULLS LAST
       LIMIT 20`,
      [term, session.user.id],
    );

    return NextResponse.json({ users: rows });
  }

  if (ids) {
    const idList = ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!idList.length) {
      return NextResponse.json({ users: [] });
    }

    const placeholders = idList.map((_, i) => `$${i + 1}`).join(", ");

    const { rows } = await pingpalPool.query(
      `${baseSelect}
       WHERE ${baseWhere}
         AND u.id IN (${placeholders})`,
      idList,
    );

    return NextResponse.json({ users: rows });
  }

  const { rows } = await pingpalPool.query(
    `${baseSelect}
     WHERE ${baseWhere}
       AND u.id != $1
     ORDER BY u.name ASC NULLS LAST
     LIMIT 50`,
    [session.user.id],
  );

  return NextResponse.json({ users: rows });
}
