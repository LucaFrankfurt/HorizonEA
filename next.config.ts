import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // Database drivers must not be bundled: PGlite ships a WASM binary and
  // `pg` has optional native bindings.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Migrations are read from disk at runtime; make sure tracing ships them.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
  // Never ship the local embedded database with the build output.
  outputFileTracingExcludes: {
    "/**": ["./data/**/*"],
  },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
