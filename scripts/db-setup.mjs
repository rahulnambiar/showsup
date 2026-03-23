#!/usr/bin/env node
/**
 * npm run db:setup
 *
 * Applies supabase/schema.sql to your database. Tries in order:
 *   1. psql with SUPABASE_DB_URL (or DATABASE_URL)
 *   2. Supabase CLI: supabase db push
 *   3. Prints SQL with manual instructions
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "../supabase/schema.sql");
const sql = readFileSync(schemaPath, "utf8");

// Load .env.local if present
try {
  const envPath = join(__dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && !process.env[key]) process.env[key] = rest.join("=");
  }
} catch {
  // .env.local not found — using existing process.env
}

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

// 1. Try psql
if (dbUrl) {
  console.log("Applying schema via psql...");
  const result = spawnSync("psql", [dbUrl], {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
    encoding: "utf8",
  });
  if (result.status === 0) {
    console.log("✓ Database schema applied.");
    process.exit(0);
  }
  console.warn("psql failed (exit code", result.status, ")");
}

// 2. Try Supabase CLI
const cliCheck = spawnSync("supabase", ["--version"], { stdio: "pipe" });
if (cliCheck.status === 0) {
  console.log("Supabase CLI found — running: supabase db push");
  const result = spawnSync("supabase", ["db", "push"], { stdio: "inherit" });
  if (result.status === 0) {
    console.log("✓ Database schema applied.");
    process.exit(0);
  }
  console.warn("supabase db push failed. Falling back to manual.");
}

// 3. Manual instructions
console.log(`
────────────────────────────────────────────────────────────
  Manual setup:

  1. Open your Supabase project → SQL Editor
     https://supabase.com/dashboard/project/_/sql/new

  2. Paste the contents of supabase/schema.sql and run it.

  To use psql directly, add to .env.local:
    SUPABASE_DB_URL=postgres://postgres:[password]@[host]:5432/postgres
  (find this in Supabase → Settings → Database → Connection string)

  Then re-run: npm run db:setup
────────────────────────────────────────────────────────────

--- supabase/schema.sql ---
`);
console.log(sql);
