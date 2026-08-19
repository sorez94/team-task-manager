// Prisma 7 config: the CLI (migrate/generate/studio/seed) reads connection
// info and paths from here instead of the schema file. The app's own
// PrismaClient (lib/prisma.ts) still gets its connection via the driver
// adapter at runtime, independent of this file.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI's datasource only accepts a single connection string (no separate
// auth-token field), so when targeting a hosted Turso database, the token
// is appended as a query param — the same convention Turso's own docs use
// for tools that only take one URL. Local dev's `file:` URL is untouched.
function resolveCliDatabaseUrl() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!authToken || !url.startsWith("libsql:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}authToken=${authToken}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveCliDatabaseUrl(),
  },
});
