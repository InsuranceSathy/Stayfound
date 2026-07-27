import { betterAuth } from "better-auth";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

// Share the session cookie across www + app subdomains in production, so a
// login on app.stayfound.tech is valid everywhere. Never on localhost (a
// .stayfound.tech cookie would be rejected there).
const onStayfound = (process.env.BETTER_AUTH_URL || "").includes("stayfound.tech");

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

  // Allow both subdomains + local to start auth flows.
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "https://app.stayfound.tech",
    "https://www.stayfound.tech",
    "https://stayfound.tech",
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((v): v is string => Boolean(v)),

  ...(onStayfound
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: ".stayfound.tech",
          },
        },
      }
    : {}),
});
