// index.js
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// config
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const PORT = 3000;

const follows = new Map<string, Set<string>>();
const lastKnownReleases = new Map<string, Set<string>>();

// follow endpoint (minimal)
app.post('/follow', (req: express.Request<{ userId: string; actorId: string }>, res: express.Response<{ error?: string; ok: boolean }>) => {
	const { userId, actorId } = req.body;
	if (!userId || !actorId) {
		res.status(400).json({ error: 'userId and actorId required' });
		return;
	}

	if (!follows.has(actorId)) {
		follows.set(actorId, new Set([userId]));
	} else {
		follows.get(actorId)?.add(userId);
	}

	return res.json({ ok: true });
});

// poll TMDb for new releases for followed actors
async function checkForUpdates() {
	if (!TMDB_API_KEY) {
		console.log('Set TMDB_API_KEY in your environment.');
		return;
	}

	for (const [actorId, userIds] of follows.entries()) {
		try {
			// get movie credits for this person
			const url = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`;
			const resp = await axios.get(url);
			const credits = resp.data.cast as { id: string; title: string; release_date: string }[];

			// treat every credit with a release_date as a "release"
			const moviesWithDate = credits.filter(m => m.release_date);

			const seenMovieIds = new Set(
				(lastKnownReleases.get(actorId) || new Set())
			);
			const newMovies = moviesWithDate.filter(m => !seenMovieIds.has(m.id));

			if (newMovies.length > 0) {
				// "notify" users
				for (const m of newMovies) {
					for (const userId of userIds) {
						console.log(
							`[NOTIFY] user ${userId}: actor ${actorId} has new movie "${m.title}" releasing on ${m.release_date}`
						);
					}
					seenMovieIds.add(m.id);
				}
				lastKnownReleases.set(actorId, seenMovieIds as Set<string>);
			}
		} catch (err) {
			console.error('Error checking actor', actorId, err.message);
		}
	}
}

// run the poller every 60 seconds
setInterval(checkForUpdates, 60 * 1000);

// start server
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
