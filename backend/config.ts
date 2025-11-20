import dotenv from 'dotenv';

dotenv.config();

// helper to read required env vars with optional fallback
function getEnv(key: string, fallback?: string): string {
	const value = process.env[key] ?? fallback;
	if (value === undefined) {
		throw new Error(`missing required environment variable ${key}`);
	}
	return value;
}

// server + poller config
export const PORT = Number(process.env.PORT ?? 3000);
export const TMDB_API_KEY = process.env.TMDB_API_KEY ?? '';
export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 60_000);

// secrets
export const JWT_SECRET = getEnv('JWT_SECRET', 'dev-jwt-secret');

