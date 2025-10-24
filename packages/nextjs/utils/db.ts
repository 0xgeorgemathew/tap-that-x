import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

/**
 * Database Utility for TapThat X
 * Manages PostgreSQL connection pool for push subscriptions and bridge requests
 */

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 * Uses DATABASE_URL environment variable
 */
export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString,
      // Use SSL in production (Railway, Heroku, etc.)
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
      // Connection pool settings
      max: 20, // Maximum connections
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Wait 10s for connection
    });

    // Log pool errors
    pool.on("error", (err: Error) => {
      console.error("Unexpected database pool error:", err);
    });

    console.log("✓ Database connection pool initialized");
  }

  return pool;
}

/**
 * Execute a SQL query
 * @param text SQL query string
 * @param params Query parameters (optional)
 * @returns Query result
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const pool = getDbPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    // Log slow queries (>1s)
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error("Database query error:", error);
    console.error("Query:", text);
    console.error("Params:", params);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * Remember to call client.release() when done!
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getDbPool();
  return await pool.connect();
}

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 *
 * @param callback Function to execute within transaction
 * @returns Result of callback function
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getClient();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database connection pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✓ Database connection pool closed");
  }
}

/**
 * Test database connection
 * @returns true if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query("SELECT NOW() as current_time");
    console.log("✓ Database connection successful:", result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    return false;
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface PushSubscription {
  id: number;
  user_address: string;
  subscription_endpoint: string;
  subscription_keys: {
    p256dh: string;
    auth: string;
  };
  created_at: Date;
}

export interface BridgeRequest {
  id: number;
  request_id: string;
  user_address: string;
  source_chain: number;
  dest_chain: number;
  token_address: string;
  amount: string;
  created_at: Date;
  expires_at: Date;
}
