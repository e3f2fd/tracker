import { query } from '../db.js';

// saves a follow for an actor (from user query)
export async function saveFollow(userId: string, actorQuery: string): Promise<void> {
	await query(
		`
			INSERT INTO follows (user_id, actor_id)
			VALUES ($1, $2)
			ON CONFLICT (user_id, actor_id) DO NOTHING
		`,
		[userId, actorQuery]
	);
}

// gets all followers for an actor (by query)
export async function getActorFollowers(): Promise<Map<string, string[]>> {
	const result = await query<{ actor_id: string; user_ids: string[] | null }>(
		`
			SELECT actor_id, array_agg(user_id ORDER BY user_id) AS user_ids
			FROM follows
			GROUP BY actor_id
		`
	);

	const map = new Map<string, string[]>();
	for (const row of result.rows) {
		map.set(row.actor_id, row.user_ids ?? []);
	}
	return map;
}

// gets all follows for a user
export async function getUserFollows(userId: string): Promise<string[]> {
	const result = await query<{ actor_id: string }>(
		`
			SELECT actor_id
			FROM follows
			WHERE user_id = $1
		`,
		[userId]
	);
	return result.rows.map(row => row.actor_id);
}