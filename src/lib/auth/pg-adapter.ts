import type { Adapter } from "next-auth/adapters";
import type { Pool } from "pg";

export function PgSnakeAdapter(pool: Pool): Adapter {
  return {
    async getUserByAccount({ provider, providerAccountId }) {
      const result = await pool.query(
        `
        SELECT u.*
        FROM accounts a
        JOIN users u
          ON u.id = a.user_id
        WHERE a.provider = $1
        AND a.provider_account_id = $2
        `,
        [provider, providerAccountId],
      );

      return result.rows[0] ?? null;
    },

    async getSessionAndUser(sessionToken) {
      const result = await pool.query(
        `
        SELECT s.*, u.*
        FROM sessions s
        JOIN users u
          ON u.id = s.user_id
        WHERE s.session_token = $1
        `,
        [sessionToken],
      );

      if (!result.rows.length) return null;

      const row = result.rows[0];

      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: row.expires,
        },
        user: {
          id: row.id,
          email: row.email,
        },
      };
    },

    async createSession(session) {
      await pool.query(
        `
        INSERT INTO sessions (session_token, user_id, expires)
        VALUES ($1,$2,$3)
        `,
        [session.sessionToken, session.userId, session.expires],
      );

      return session;
    },

    async deleteSession(sessionToken) {
      await pool.query(
        `
        DELETE FROM sessions
        WHERE session_token = $1
        `,
        [sessionToken],
      );
    },
  } as Adapter;
}
