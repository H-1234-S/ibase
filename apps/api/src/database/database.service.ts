import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema } from './schemas/index.js';

/** Owns the PostgreSQL pool and Drizzle database instance for the API process. */
@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;
  readonly db: NodePgDatabase<typeof schema>;

  constructor(configService: ConfigService) {
    this.pool = new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
    this.db = drizzle(this.pool, { schema });
  }

  /** Executes a lightweight query to confirm PostgreSQL is reachable. */
  async checkConnection() {
    await this.db.execute(sql`select 1`);
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
