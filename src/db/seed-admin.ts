/**
 * Idempotent admin user seed — run after migrations.
 * Override defaults via environment variables:
 *   ADMIN_EMAIL    (default: admin@super-app.local)
 *   ADMIN_PASSWORD (default: Admin@123)
 *   ADMIN_NAME     (default: Admin)
 */
import bcrypt from "bcryptjs";
import "dotenv/config";
import { authPool } from "@/lib/db";

const DEFAULT_EMAIL = "admin@super-app.local";
const DEFAULT_PASSWORD = "Admin@123";
const DEFAULT_NAME = "Admin";
const ADMIN_ROLE = "admin";
const APP = "super-app";

export async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL).toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const name = process.env.ADMIN_NAME ?? DEFAULT_NAME;

  const client = await authPool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO super.roles (role, role_code, description, app, start_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       ON CONFLICT (role_code) DO NOTHING`,
      ["Administrator", ADMIN_ROLE, "Full system administrator", APP],
    );

    const hashed = await bcrypt.hash(password, 12);

    const { rows: existing } = await client.query(
      `SELECT id FROM super.users WHERE LOWER(email) = $1`,
      [email],
    );

    if (existing.length === 0) {
      await client.query(`INSERT INTO super.users (name, email, password) VALUES ($1, $2, $3)`, [
        name,
        email,
        hashed,
      ]);
      console.info(`Created admin user: ${email}`);
    } else {
      await client.query(`UPDATE super.users SET name = $1, password = $2 WHERE id = $3`, [
        name,
        hashed,
        existing[0].id,
      ]);
      console.info(`Updated admin user: ${email}`);
    }

    await client.query(
      `INSERT INTO super.user_roles (email, role_code, start_date)
       VALUES ($1, $2, CURRENT_DATE)
       ON CONFLICT (email, role_code) DO NOTHING`,
      [email, ADMIN_ROLE],
    );

    await client.query("COMMIT");
    console.info("Admin seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  await seedAdminUser();
  await authPool.end();
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").includes("seed-admin");
if (isDirectRun) {
  main().catch((err) => {
    console.error("Admin seed failed:", err);
    process.exit(1);
  });
}
