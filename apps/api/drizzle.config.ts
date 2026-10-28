import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../.env' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set in the repository .env file');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schemas/index.ts',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
});
