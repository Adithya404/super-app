import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pool } from "@/lib/db";

const migrationsDir = path.join(process.cwd(), "src/db/migrations");

async function ensureMigrationTable() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS super;

    CREATE TABLE IF NOT EXISTS super.migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now()
);
  `);
}

// async function runMigrations() {
//   await ensureMigrationTable();
//   const files = fs.readdirSync(migrationsDir).sort();

//   for (const file of files) {
//     console.log(`Running migration: ${file}`);
//     const result = await pool.query('SELECT 1 FROM super.migrations WHERE name = $1', [file]);
//     let sql: string;
//     if (result.rowCount && result.rowCount > 0) {
//       sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
//       const checksum = hashMigration(sql);
//       const existing = await pool.query('SELECT checksum FROM super.migrations WHERE name = $1', [
//         file,
//       ]);
//       if (existing.rowCount) {
//         const dbChecksum = existing.rows[0].checksum;
//         console.log('dbchecksum', dbChecksum);
//         if (dbChecksum !== checksum) {
//           console.log(`Migration ${file} was modified after being applied`);
//           throw new Error(`Migration ${file} was modified after being applied`);
//         }
//         continue;
//       }
//     }

//     try {
//       await pool.query('BEGIN');

//       await pool.query(sql);

//       await pool.query('INSERT INTO super.migrations(name, checksum) VALUES ($1, $2)', [
//         file,
//         checksum,
//       ]);

//       await pool.query('COMMIT');
//     } catch (error) {
//       await pool.query('ROLLBACK');
//       console.error(`Migration failed: ${file}`);
//       throw error;
//     }
//   }

//   console.log('Migrations complete');
// }
async function runMigrations() {
  await ensureMigrationTable();
  let count = 0;
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const checksum = hashMigration(sql);

    const existing = await pool.query("SELECT checksum FROM super.migrations WHERE name = $1", [
      file,
    ]);

    // Migration already applied
    if (existing.rowCount && existing.rowCount > 0) {
      const dbChecksum = existing.rows[0].checksum;

      if (dbChecksum !== checksum) {
        throw new Error(`Chescksum mismatch for ${file}\n Aborting.`);
      }

      // Migration already applied and valid
      continue;
    }

    console.info(`Applying migration: ${file}`);

    try {
      await pool.query("BEGIN");

      await pool.query(sql);

      await pool.query("INSERT INTO super.migrations(name, checksum) VALUES ($1, $2)", [
        file,
        checksum,
      ]);

      await pool.query("COMMIT");
      count = count + 1;
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error(`Migration failed: ${file}`);
      throw error;
    }
  }
  if (count === 0) {
    console.info("No New Migrations");
  } else {
    console.info(`${count} Migration(s) applied.`);
  }
}
async function main() {
  // Acquire global advisory lock
  await pool.query("SELECT pg_advisory_lock(987654321)");

  try {
    await runMigrations();
  } finally {
    // Always release the lock
    await pool.query("SELECT pg_advisory_unlock(987654321)");
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

function hashMigration(sql: string) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}
