import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.join(process.cwd(), "src/db/migrations");

function timestamp() {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function createMigration(name: string) {
  if (!name) {
    console.error("Migration name required");
    process.exit(1);
  }

  const ts = timestamp();
  const fileName = `${ts}_${name}.sql`;

  const filePath = path.join(migrationsDir, fileName);

  const template = `-- Migration: ${fileName}
-- Created at: ${new Date().toISOString()}

BEGIN;

-- Write your SQL here


COMMIT;
`;

  fs.writeFileSync(filePath, template);

  console.info(`Created migration: ${fileName}`);
}

const name = process.argv[2];

createMigration(name);
