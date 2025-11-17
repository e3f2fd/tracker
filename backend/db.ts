import dotenv from 'dotenv';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

dotenv.config();

const ssl =
	process.env.PGSSL === 'true'
		? {
				rejectUnauthorized: false
			}
		: undefined;

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
	return pool.query<T>(text, params);
}

export async function withTransaction<T>(handler: (client: PoolClient) => Promise<T>): Promise<T> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await handler(client);
		await client.query('COMMIT');
		return result;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}

export async function shutdownPool(): Promise<void> {
	await pool.end();
}

process.on('SIGTERM', () => {
	shutdownPool().catch(err => {
		console.error('failed to close DB pool on SIGTERM', err);
	});
});

process.on('SIGINT', () => {
	shutdownPool().catch(err => {
		console.error('failed to close DB pool on SIGINT', err);
	});
});

