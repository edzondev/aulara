import { getDatabaseUrl } from "@aulara/env/database";
import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema/index.ts";

export type AppDatabase = NeonDatabase<typeof schema>;

export type DatabaseHandle = {
	db: AppDatabase;
	pool: Pool;
};

const globalForDatabase = globalThis as typeof globalThis & {
	__aularaDatabase?: DatabaseHandle;
};

export function createDatabase(connectionString: string): DatabaseHandle {
	const pool = new Pool({ connectionString });
	const db = drizzle(pool, { schema });
	return { db, pool };
}

export function getDatabase(): AppDatabase {
	if (!globalForDatabase.__aularaDatabase) {
		globalForDatabase.__aularaDatabase = createDatabase(getDatabaseUrl());
	}

	return globalForDatabase.__aularaDatabase.db;
}

export async function closeDatabase(handle?: DatabaseHandle): Promise<void> {
	const target = handle ?? globalForDatabase.__aularaDatabase;

	if (!target) {
		return;
	}

	await target.pool.end();

	if (!handle) {
		delete globalForDatabase.__aularaDatabase;
	}
}
