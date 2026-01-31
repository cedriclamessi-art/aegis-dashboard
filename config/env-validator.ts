/**
 * Environment Variables Validator
 * Validates all required environment variables at startup
 * Database and Redis are optional for demo/MVP mode
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
const rootEnvPath = resolve(process.cwd(), '.env');
const configEnvPath = resolve(process.cwd(), 'config', '.env');

if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
} else if (existsSync(configEnvPath)) {
  config({ path: configEnvPath });
} else {
  config();
}

interface ValidationRule {
  name: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'url' | 'email';
  minLength?: number;
  pattern?: RegExp;
  validator?: (value: string) => boolean;
}

const validationRules: ValidationRule[] = [
  // Database (optional for MVP/demo mode)
  { name: 'DATABASE_URL', required: false, type: 'url' },
  { name: 'DB_HOST', required: false },
  { name: 'DB_PORT', required: false, type: 'number' },
  { name: 'DB_NAME', required: false },
  { name: 'DB_USER', required: false },
  { name: 'DB_PASSWORD', required: false, minLength: 8 },
  { name: 'DB_POOL_MIN', required: false, type: 'number' },
  { name: 'DB_POOL_MAX', required: false, type: 'number' },
  { name: 'DB_SSL', required: false, type: 'boolean' },
  
  // Redis (optional for MVP/demo mode)
  { name: 'REDIS_URL', required: false, type: 'url' },
  { name: 'REDIS_HOST', required: false },
  { name: 'REDIS_PORT', required: false, type: 'number' },
  
  // Security
  { 
    name: 'JWT_SECRET', 
    required: false, 
    minLength: 32,
    validator: (value) => value.length >= 32
  },
  { 
    name: 'ENCRYPTION_KEY', 
    required: false, 
    minLength: 32,
    validator: (value) => value.length === 64 // hex string
  },
  
  // Application
  { name: 'NODE_ENV', required: false },
  { name: 'PORT', required: false, type: 'number' },
  { name: 'ALLOWED_ORIGINS', required: false },
  
  // Logging
  { name: 'LOG_LEVEL', required: false },
];

class EnvironmentValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  validate(): void {
    console.log('🔍 Validating environment variables...');

    // Validate each rule
    for (const rule of validationRules) {
      this.validateRule(rule);
    }

    // Check if at least one connector is configured
    this.validateConnectors();

    // Display results
    this.displayResults();

    // Exit if there are errors
    if (this.errors.length > 0) {
      console.error('\n❌ Environment validation failed!');
      console.error('Please fix the errors above and restart the application.\n');
      process.exit(1);
    }

    console.log('✅ Environment validation passed!\n');
  }

  private validateRule(rule: ValidationRule): void {
    const value = process.env[rule.name];

    // Check if required
    if (rule.required && !value) {
      this.errors.push(`❌ ${rule.name} is required but not set`);
      return;
    }

    // Skip if not set and not required
    if (!value) {
      return;
    }

    // Validate type
    if (rule.type) {
      switch (rule.type) {
        case 'number':
          if (isNaN(Number(value))) {
            this.errors.push(`❌ ${rule.name} must be a number`);
          }
          break;
        case 'boolean':
          if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
            this.errors.push(`❌ ${rule.name} must be a boolean`);
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            this.errors.push(`❌ ${rule.name} must be a valid URL`);
          }
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            this.errors.push(`❌ ${rule.name} must be a valid email`);
          }
          break;
      }
    }

    // Validate minimum length
    if (rule.minLength && value.length < rule.minLength) {
      this.errors.push(
        `❌ ${rule.name} must be at least ${rule.minLength} characters (current: ${value.length})`
      );
    }

    // Validate pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      this.errors.push(`❌ ${rule.name} does not match required pattern`);
    }

    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      this.errors.push(`❌ ${rule.name} failed custom validation`);
    }
  }

  private validateConnectors(): void {
    const connectors = [
      'META_APP_ID',
      'TIKTOK_APP_ID',
      'GOOGLE_CLIENT_ID',
      'PINTEREST_APP_ID',
      'SHOPIFY_API_KEY',
    ];

    const configuredConnectors = connectors.filter(
      (connector) => process.env[connector]
    );

    if (configuredConnectors.length === 0) {
      console.log('⚠️  No OAuth connectors configured. Running in mock/demo mode.');
    } else {
      console.log(
        `✅ ${configuredConnectors.length} connector(s) configured`
      );
    }
  }

  private displayResults(): void {
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning) => console.log(`  ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error) => console.log(`  ${error}`));
    }
  }
}

// Export validator instance
export const validateEnvironment = (): void => {
  const validator = new EnvironmentValidator();
  validator.validate();
};

// Generate a default encryption key if not provided
function getDefaultEncryptionKey(): string {
  if (process.env.ENCRYPTION_KEY) {
    return process.env.ENCRYPTION_KEY;
  }
  // Generate a random 64-char hex key
  return require('crypto').randomBytes(32).toString('hex');
}

// Generate a default JWT secret if not provided
function getDefaultJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  // Generate a random 32-char string
  return require('crypto').randomBytes(32).toString('hex');
}

// Export environment variables with type safety
export const env = {
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'aegis_v5',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN || '1'),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  security: {
    jwtSecret: getDefaultJwtSecret(),
    encryptionKey: getDefaultEncryptionKey(),
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};
