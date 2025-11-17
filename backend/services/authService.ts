import { randomUUID } from 'crypto';

import jwt, { JwtPayload } from 'jsonwebtoken';

import { JWT_SECRET } from '../config.js';
import { query } from '../db.js';

type DbUser = {
	id: string;
	email: string;
	display_name: string | null;
	provider: string;
	provider_user_id: string;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
};

export type User = {
	id: string;
	email: string;
	displayName: string | null;
	provider: string;
	providerUserId: string;
	avatarUrl: string | null;
	createdAt: string;
	updatedAt: string;
};

// converts a db row into the public user shape
function mapDbUser(row: DbUser): User {
	return {
		id: row.id,
		email: row.email,
		displayName: row.display_name,
		provider: row.provider,
		providerUserId: row.provider_user_id,
		avatarUrl: row.avatar_url,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

// creates or updates a user record from OAuth profile data
export async function upsertOAuthUser(input: {
	email: string;
	displayName: string | null;
	provider: string;
	providerUserId: string;
	avatarUrl: string | null;
}): Promise<User> {
	const existing = await query<DbUser>(
		`
			SELECT *
			FROM users
			WHERE provider = $1 AND provider_user_id = $2
			LIMIT 1
		`,
		[input.provider, input.providerUserId]
	);

	const existingRow = existing.rows[0];

	if (existingRow) {
		const updated = await query<DbUser>(
			`
				UPDATE users
				SET email = $1,
					display_name = $2,
					avatar_url = $3,
					updated_at = CURRENT_TIMESTAMP
				WHERE provider = $4 AND provider_user_id = $5
				RETURNING *
			`,
			[input.email, input.displayName, input.avatarUrl, input.provider, input.providerUserId]
		);

		return mapDbUser(updated.rows[0]);
	}

	const inserted = await query<DbUser>(
		`
			INSERT INTO users (id, email, display_name, provider, provider_user_id, avatar_url)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING *
		`,
		[randomUUID(), input.email, input.displayName, input.provider, input.providerUserId, input.avatarUrl]
	);

	return mapDbUser(inserted.rows[0]);
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

// creates a signed JWT for a user
export function generateAuthToken(user: User): string {
	return jwt.sign(
		{
			sub: user.id,
			email: user.email,
			provider: user.provider
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

