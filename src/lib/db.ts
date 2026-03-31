// lib/db.ts
import { Pool } from "pg";

// Auth pool — points to "super" schema
export const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

authPool.on("connect", (client) => {
  client.query('SET search_path TO "super"');
});

// App pool — points to your default/public schema (or any other)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
