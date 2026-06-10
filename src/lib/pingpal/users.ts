import type { PoolClient } from "pg";
import { pingpalPool } from "@/lib/db";

type Queryable = Pick<PoolClient, "query"> | typeof pingpalPool;

/** Verify a user exists in super.users and has an active chat role. */
export async function assertChatEligibleUser(
  userId: string,
  client: Queryable = pingpalPool,
): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT 1
     FROM super.users u
     JOIN super.user_roles ur ON ur.email = u.email
     WHERE u.id = $1
       AND ur.role_code IN ('chat_personnel', 'chat_master')
       AND (ur.end_date IS NULL OR ur.end_date > CURRENT_DATE)
     LIMIT 1`,
    [userId],
  );
  return rows.length > 0;
}
