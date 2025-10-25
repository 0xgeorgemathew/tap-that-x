import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Get or create a PostgreSQL connection pool
 * Uses DATABASE_URL environment variable
 */
export function getDbPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Increased to 10 seconds
      query_timeout: 10000, // Query timeout 10 seconds
      statement_timeout: 10000, // Statement timeout 10 seconds
    });

    // Handle pool errors
    pool.on("error", () => {
      // Silent - errors are handled in query function
    });
  }

  return pool;
}

/**
 * Execute a SQL query with retry logic
 * @param text SQL query string
 * @param params Query parameters
 * @param retries Number of retries (default: 3)
 * @returns Query result
 */
export async function query(text: string, params?: any[], retries = 3): Promise<any> {
  const pool = getDbPool();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error: any) {
      // If connection error and we have retries left, reset pool and try again
      if (attempt < retries && (error.message.includes("timeout") || error.message.includes("terminated"))) {
        await closePool();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }

      throw error;
    }
  }

  throw new Error("Query failed after all retries");
}

/**
 * Close the database pool
 * Call this on application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
