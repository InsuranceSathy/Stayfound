import { betterAuth } from "better-auth";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const auth = betterAuth({
  // Built-in Kysely adapter talks to Postgres via a pg Pool.
  // Works locally and on Vercel (Neon, Supabase, etc.).
  database: new Pool({ connectionString }),

  // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from env automatically.
  baseURL: process.env.BETTER_AUTH_URL,

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Allow the deployment + local origin to start auth flows.
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((v): v is string => Boolean(v)),
});
