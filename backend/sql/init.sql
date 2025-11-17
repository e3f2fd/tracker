CREATE TABLE IF NOT EXISTS users (
	id TEXT NOT NULL PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	display_name TEXT,
	provider TEXT NOT NULL,
	provider_user_id TEXT NOT NULL,
	avatar_url TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS follows (
	user_id TEXT NOT NULL REFERENCES users(id),
	actor_id TEXT NOT NULL,
	PRIMARY KEY (user_id, actor_id)
);

CREATE TABLE IF NOT EXISTS actors (
	id TEXT NOT NULL PRIMARY KEY,
	name TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actor_releases (
	actor_id TEXT NOT NULL REFERENCES actors(id),
	movie_id TEXT NOT NULL,
	media_type TEXT NOT NULL,
	title TEXT NOT NULL,
	release_date TEXT,
	PRIMARY KEY (actor_id, movie_id)
);

CREATE INDEX IF NOT EXISTS actor_releases_actor_idx ON actor_releases (actor_id);

UPDATE actor_releases
SET media_type = COALESCE(media_type, 'movie');

