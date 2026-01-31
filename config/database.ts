/**
 * Database Configuration with Connection Pooling and Safeguards
 */

import { Pool, PoolConfig, PoolClient } from 'pg';
import { env } from './env-validator';

const config: PoolConfig = {
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,

  // Connection pool settings
  min: env.database.poolMin,
  max: env.database.poolMax,

  // Timeout settings
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  statement_timeout: 30000, // 30 seconds for queries

  // SSL configuration
  ssl: env.database.ssl
    ? {
        rejectUnauthorized: env.isProduction,
      }
    : false,

  // Allow pool to close when idle
  allowExitOnIdle: false,
};

class DatabaseManager {
  private pool: Pool;
  private isShuttingDown: boolean = false;

  constructor() {
    this.pool = new Pool(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle pool errors
    this.pool.on('error', (err: Error, client: PoolClient) => {
      console.error('Unexpected database pool error:', err);
      // Don't exit the process, just log the error
    });

    // Handle client connection
    this.pool.on('connect', (client: PoolClient) => {
      if (env.isDevelopment) {
        console.log('New database client connected');
      }
    });

    // Handle client removal
    this.pool.on('remove', (client: PoolClient) => {
      if (env.isDevelopment) {
        console.log('Database client removed from pool');
      }
    });
  }

  /**
   * Get a client from the pool
   */
  async getClient() {
    if (this.isShuttingDown) {
      throw new Error('Database is shutting down, cannot acquire new connections');
    }
    return this.pool.connect();
  }

  /**
   * Execute a query with automatic client management
   */
  async query(text: string, params?: any[]) {
    if (this.isShuttingDown) {
      throw new Error('Database is shutting down, cannot execute queries');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        console.warn('Slow query detected:', {
          duration: `${duration}ms`,
          query: text.substring(0, 100),
        });
      }

      return result;
    } catch (error) {
      console.error('Database query error:', {
        error,
        query: text.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Database is shutting down, cannot start transactions');
    }

    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Set tenant context for RLS
   */
  async setTenantContext(client: any, tenantId: string): Promise<void> {
    await client.query('SET LOCAL saas.tenant_id = $1', [tenantId]);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    console.log('Shutting down database connections...');
    this.isShuttingDown = true;

    try {
      // Wait for active queries to complete (max 10 seconds)
      const maxWait = 10000;
      const startTime = Date.now();

      while (this.pool.totalCount > this.pool.idleCount) {
        if (Date.now() - startTime > maxWait) {
          console.warn('Forcing database shutdown after timeout');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.pool.end();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error during database shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = new DatabaseManager();

