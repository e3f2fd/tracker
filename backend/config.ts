import dotenv from 'dotenv';

dotenv.config();

// gets an environment variable
function getEnv(key: string, fallback?: string): string {
	const value = process.env[key] ?? fallback;
	if (value === undefined) {
		throw new Error(`Missing required environment variable ${key}`);
	}
	return value;
}

// port
export const PORT = Number(process.env.PORT ?? 3000);

// node environment
export const NODE_ENV = process.env.NODE_ENV ?? 'development';

// session secret
export const SESSION_SECRET = getEnv('SESSION_SECRET', 'dev-session-secret');

// JWT secret
export const JWT_SECRET = getEnv('JWT_SECRET', 'dev-jwt-secret');

// Google client ID
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');

// Google client secret
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');

// Google redirect URI
export const GOOGLE_REDIRECT_URI =
	process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${PORT}/auth/google/callback`;

