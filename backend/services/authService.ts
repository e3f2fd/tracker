import { randomUUID } from 'crypto';

import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { JWT_SECRET } from '../config.js';
import { query } from '../db.js';

type DbUser = {
	id: string;
	username: string;
	password_hash: string;
	display_name: string | null;
	created_at: string;
	updated_at: string;
};

export type User = {
	id: string;
	username: string;
	displayName: string | null;
	createdAt: string;
	updatedAt: string;
};

const PASSWORD_SALT_ROUNDS = 12;

// converts a db row into the public user shape
function mapDbUser(row: DbUser): User {
	return {
		id: row.id,
		username: row.username,
		displayName: row.display_name,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

// loads a user by their id
export async function getUserById(id: string): Promise<User | null> {
	const result = await query<DbUser>(
		`
			SELECT *
			FROM users
			WHERE id = $1
			LIMIT 1
		`,
		[id]
	);

	if (result.rowCount === 0) {
		return null;
	}

	return mapDbUser(result.rows[0]);
}

async function getUserWithSensitiveFieldsByUsername(username: string): Promise<DbUser | null> {
	const result = await query<DbUser>(
		`
			SELECT *
			FROM users
			WHERE username = $1
			LIMIT 1
		`,
		[username]
	);

	return result.rowCount ? result.rows[0] : null;
}

export async function createUser(input: {
	username: string;
	password: string;
	displayName?: string | null;
}): Promise<User> {
	const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
	const inserted = await query<DbUser>(
		`
			INSERT INTO users (id, username, password_hash, display_name)
			VALUES ($1, $2, $3, $4)
			RETURNING *
		`,
		[randomUUID(), input.username, passwordHash, input.displayName ?? null]
	);

	return mapDbUser(inserted.rows[0]);
}

export async function authenticateUser(input: { username: string; password: string }): Promise<User | null> {
	const row = await getUserWithSensitiveFieldsByUsername(input.username);

	if (!row) {
		return null;
	}

	const matches = await bcrypt.compare(input.password, row.password_hash);
	if (!matches) {
		return null;
	}

	return mapDbUser(row);
}

// creates a signed JWT for a user
export function generateAuthToken(user: User): string {
	return jwt.sign(
		{
			sub: user.id,
			username: user.username
		},
		JWT_SECRET,
		{
			expiresIn: '7d'
		}
	);
}

// verifies and decodes a user JWT
export function verifyAuthToken(token: string): JwtPayload & { sub: string } {
	const decoded = jwt.verify(token, JWT_SECRET);
	if (typeof decoded === 'string' || !decoded.sub) {
		throw new Error('Invalid token');
	}

	return decoded as JwtPayload & { sub: string };
}

