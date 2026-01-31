import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { config } from 'dotenv';
import { existsSync } from 'fs';

async function initDB() {
  console.log('🗄️  Initializing PostgreSQL database...\n');

  try {
    const rootEnvPath = path.join(process.cwd(), '.env');
    const configEnvPath = path.join(process.cwd(), 'config', '.env');
    if (existsSync(rootEnvPath)) {
      config({ path: rootEnvPath });
    } else if (existsSync(configEnvPath)) {
      config({ path: configEnvPath });
    } else {
      config();
    }

    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    await client.query(schema);
    await client.end();

    console.log('✅ Schema applied successfully');

    console.log('\n🎉 Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDB();
