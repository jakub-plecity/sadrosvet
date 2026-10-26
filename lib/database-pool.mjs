import {getDatabase as getNetlifyDatabase} from "@netlify/database";
import pg from "pg";

let supabasePool;

// A separate switch prevents a newly added secret from moving live traffic.
// Never fall back after a Supabase connection failure: that would split orders.
/** @returns {{pool: import("pg").Pool}} */
export function getDatabase() {
  const provider = process.env.DATABASE_PROVIDER || "netlify";
  if (provider === "netlify") {
    return /** @type {{pool: import("pg").Pool}} */ (/** @type {unknown} */ (getNetlifyDatabase()));
  }
  if (provider !== "supabase") throw new Error("Unsupported DATABASE_PROVIDER");
  if (!supabasePool) {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    if (!connectionString) throw new Error("SUPABASE_DATABASE_URL is required");
    const url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Invalid database protocol");
    // Set TLS explicitly; URL sslmode parameters must not override verification.
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
    const ca = process.env.SUPABASE_DATABASE_CA?.replaceAll('\\n', '\n');
    supabasePool = new pg.Pool({
      connectionString: url.toString(),
      ssl: {rejectUnauthorized: true, ...(ca ? {ca} : {})},
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    // Do not log connection strings or driver errors containing server details.
    supabasePool.on("error", () => console.error("Supabase idle connection error"));
  }
  return {pool: supabasePool};
}
