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
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const TMDB_API_KEY = process.env.TMDB_API_KEY ?? '';
export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 60_000);

// secrets
export const SESSION_SECRET = getEnv('SESSION_SECRET', 'dev-session-secret');
export const JWT_SECRET = getEnv('JWT_SECRET', 'dev-jwt-secret');

// google oauth settings
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');
export const GOOGLE_REDIRECT_URI =
	process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${PORT}/auth/google/callback`;

