import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Prevents exhausting the SQLite connection pool from hot-reload creating
// a new PrismaClient on every file save in development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires an explicit driver adapter — it no longer reads the
// connection string straight out of the schema file at runtime. libSQL
// gives us one adapter for both modes:
//  - local dev: a plain embedded SQLite file, no native build step
//  - production (e.g. Vercel): a hosted Turso database, since serverless
//    functions don't have a persistent filesystem to keep a SQLite file on
// `authToken` is simply ignored for local `file:` URLs.
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
