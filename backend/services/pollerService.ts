import axios from 'axios';

import { TMDB_API_KEY, POLL_INTERVAL_MS } from '../config.js';
import { getActorFollowers } from './followService.js';
import { getKnownReleaseKeys, recordRelease, ReleaseRecord } from './releaseService.js';

type KnownFor = {
	id: number;
	title?: string;
	name?: string;
	release_date?: string;
	first_air_date?: string;
	media_type?: string;
};

type SearchPersonResponse = {
	results?: {
		id: number;
		name: string;
		known_for?: KnownFor[];
	}[];
};

// checks for updates for all followed actors (to notify users)
export async function checkForUpdates(): Promise<void> {
  // gets all followed actors
	const actorFollowers = await getActorFollowers();

  // checks for updates for each followed actor (to notify users)
	for (const [actorQuery, userIds] of actorFollowers.entries()) {
    // if no users following this actor, do nothing
		if (!userIds || userIds.length === 0) {
			continue;
		}

		try {
      // searches for the actor by query
			const searchUrl = new URL('https://api.themoviedb.org/3/search/person');
			searchUrl.searchParams.set('api_key', TMDB_API_KEY);
			searchUrl.searchParams.set('query', actorQuery);

			const resp = await axios.get<SearchPersonResponse>(searchUrl.toString());
			const result = resp.data.results?.[0];

			if (!result) {
				console.warn(`no updates found for actor "${actorQuery}"`);
				continue;
			}

      // gets the releases for the actor
			const releases = (result.known_for ?? [])
				.map(mapKnownForToRelease)
				.filter((r): r is ReleaseRecord => Boolean(r));

			if (releases.length === 0) {
				continue;
			}

      // gets the known releases for the actor
			const seenReleaseKeys = await getKnownReleaseKeys(actorQuery);
      // filters out the known releases
			const newReleases = releases.filter(release => !seenReleaseKeys.has(release.mediaType + ':' + release.id));

			if (newReleases.length > 0) {
        // records the new releases
				for (const release of newReleases) {
					await recordRelease(actorQuery, release);
        // notifies the users
					for (const userId of userIds) {
						console.log(
							`[NOTIFY] user ${userId}: query "${actorQuery}" has new ${release.mediaType} "${release.title}" releasing on ${release.release_date}`
						);
					}
				}
			}
		} catch (err) {
			console.error('error checking actor query', actorQuery, err instanceof Error ? err.message : String(err));
		}
	}
}

// normalises known for to release record
function mapKnownForToRelease(entry: KnownFor): ReleaseRecord | undefined {
	const releaseDate = entry.release_date ?? entry.first_air_date;
	const mediaType = entry.media_type ?? (entry.title ? 'movie' : entry.name ? 'tv' : undefined);

	if (!releaseDate || !mediaType) {
		return undefined;
	}

	return {
		id: String(entry.id),
		title: entry.title ?? entry.name ?? 'Untitled',
		release_date: releaseDate,
		mediaType
	};
}

// starts the polling loop
export function startPolling(): void {
	setInterval(() => {
		checkForUpdates().catch(err => {
			console.error('poller failed', err);
		});
	}, POLL_INTERVAL_MS);
}


