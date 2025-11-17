import express from 'express';

import { getFilmographyForActor, searchPeople } from '../services/tmdbService.js';

const router = express.Router();

// searches for an actor by query
router.get('/search', async (req, res) => {
	const query = req.query.query;

	if (typeof query !== 'string' || query.trim().length === 0) {
		res.status(400).json({ error: 'query parameter is required' });
		return;
	}

  // searches for the actor by query
	try {
		const people = await searchPeople(query.trim());
		const topMatch = people[0];

    // if no actor found, return 404
    if (!topMatch) {
			res.status(404).json({ error: `no actor found matching "${query}"` });
			return;
		}

    // gets the filmography for the actor
		const filmography = await getFilmographyForActor(topMatch.id);

    // returns the filmography
		res.json({
			actor: {
				id: topMatch.id,
				name: topMatch.name,
				knownForDepartment: topMatch.known_for_department,
				popularity: topMatch.popularity,
				profilePath: topMatch.profile_path
			},
			totalMovies: filmography.movies.length,
			totalTvShows: filmography.tv.length,
			movies: filmography.movies,
			tv: filmography.tv
		});
	} catch (err) {
		console.error('failed to search actor', err);
		res.status(500).json({ error: 'failed to search for actor' });
	}
});

export default router;

