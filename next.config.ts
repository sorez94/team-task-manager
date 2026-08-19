import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma's generated client and the libSQL driver adapter out of
  // Next's server bundle — their WASM/native pieces don't survive bundling
  // and need to be traced as plain files instead. Matters most on Vercel,
  // where the serverless function bundle is built via dependency tracing.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client"],
};

export default nextConfig;
