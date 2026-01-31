/**
 * Test Setup and Configuration
 * Runs before all tests
 */

import { config } from 'dotenv';

config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.MOCK_EXTERNAL_APIS = 'true';

// Vitest globals are enabled in vitest.config.ts
afterAll(async () => {
  // Placeholder for future resource cleanup
});
