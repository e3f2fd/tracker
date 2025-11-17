import { query } from '../db.js';

export type ReleaseRecord = {
	id: string;
	title: string;
	release_date: string;
	mediaType: string;
};

// gets the known release keys for an actor
export async function getKnownReleaseKeys(actorId: string): Promise<Set<string>> {
	const result = await query<{ movie_id: string; media_type: string }>(
		`
			SELECT movie_id, media_type
			FROM actor_releases
			WHERE actor_id = $1
		`,
		[actorId]
	);

	return new Set(result.rows.map(row => `${row.media_type}:${row.movie_id}`));
}

// records a release for an actor
export async function recordRelease(actorId: string, movie: ReleaseRecord): Promise<void> {
	await query(
		`
			INSERT INTO actor_releases (actor_id, movie_id, media_type, title, release_date)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (actor_id, movie_id) DO NOTHING
		`,
		[actorId, movie.id, movie.mediaType, movie.title, movie.release_date]
	);
}

