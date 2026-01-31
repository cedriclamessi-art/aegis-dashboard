/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of all services
 */

import { Server } from 'http';
import { db } from './database';

interface ShutdownOptions {
  timeout?: number; // Maximum time to wait for shutdown (ms)
  signals?: NodeJS.Signals[]; // Signals to listen for
}

class GracefulShutdown {
  private isShuttingDown: boolean = false;
  private server: Server | null = null;
  private shutdownCallbacks: Array<() => Promise<void>> = [];

  constructor(private options: ShutdownOptions = {}) {
    this.options.timeout = options.timeout || 30000; // 30 seconds default
    this.options.signals = options.signals || ['SIGTERM', 'SIGINT'];
  }

  /**
   * Register the HTTP server
   */
  registerServer(server: Server): void {
    this.server = server;
  }

  /**
   * Register a custom shutdown callback
   */
  onShutdown(callback: () => Promise<void>): void {
    this.shutdownCallbacks.push(callback);
  }

  /**
   * Initialize graceful shutdown handlers
   */
  init(): void {
    // Handle termination signals
    for (const signal of this.options.signals!) {
      process.on(signal, () => {
        console.log(`\nReceived ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async shutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;

    // Set a timeout to force exit if shutdown takes too long
    const forceExitTimer = setTimeout(() => {
      console.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, this.options.timeout);

    try {
      console.log('Starting graceful shutdown sequence...');

      // 1. Stop accepting new connections
      if (this.server) {
        console.log('Closing HTTP server...');
        await new Promise<void>((resolve, reject) => {
          this.server!.close((err) => {
            if (err) {
              console.error('Error closing HTTP server:', err);
              reject(err);
            } else {
              console.log('HTTP server closed');
              resolve();
            }
          });
        });
      }

      // 2. Execute custom shutdown callbacks
      console.log('Executing shutdown callbacks...');
      for (const callback of this.shutdownCallbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('Error in shutdown callback:', error);
        }
      }

      // 3. Close database connections
      console.log('Closing database connections...');
      await db.shutdown();

      // 4. Close Redis connections
      console.log('Closing Redis connections...');
      // TODO: Add Redis shutdown

      // 5. Flush logs
      console.log('Flushing logs...');
      // TODO: Flush any buffered logs

      console.log('Graceful shutdown completed successfully');
      clearTimeout(forceExitTimer);
      process.exit(exitCode);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdown(): boolean {
    return this.isShuttingDown;
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();
