import axios, { AxiosInstance } from 'axios';

import { TMDB_API_KEY } from '../config.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const MAX_DISCOVER_PAGES = 500;

export type PersonMatch = {
	id: number;
	name: string;
	profile_path?: string;
	known_for_department?: string;
	popularity?: number;
};

export type FilmSummary = {
	id: number;
	title: string;
	release_date?: string;
	overview?: string;
	poster_path?: string;
	popularity?: number;
	vote_average?: number;
	media_type: 'movie' | 'tv';
};

// start the api client
function getClient(): AxiosInstance {
	if (!TMDB_API_KEY) {
		throw new Error('TMDB_API_KEY is not configured');
	}

	return axios.create({
		baseURL: TMDB_BASE_URL,
		params: {
			api_key: TMDB_API_KEY
		}
	});
}

// search for people by name
export async function searchPeople(query: string): Promise<PersonMatch[]> {
	const client = getClient();
	const resp = await client.get('/search/person', {
		params: {
			query
		}
	});

	return (resp.data?.results ?? []) as PersonMatch[];
}

type MovieResult = {
	id: number;
	title: string;
	release_date?: string;
	overview?: string;
	poster_path?: string;
	popularity?: number;
	vote_average?: number;
};

type TvResult = {
	id: number;
	name: string;
	first_air_date?: string;
	overview?: string;
	poster_path?: string;
	popularity?: number;
	vote_average?: number;
};

// fetch all pages of results
async function fetchAllPages<T>(client: AxiosInstance, path: string, params: Record<string, unknown>): Promise<T[]> {
	const items: T[] = [];
	let page = 1;
	let totalPages = 1;

  // fills pages
	while (page <= totalPages && page <= MAX_DISCOVER_PAGES) {
		const resp = await client.get(path, {
			params: {
				...params,
				page
			}
		});

		const data = resp.data;
		const results = (data?.results ?? []) as T[];
		items.push(...results);

		totalPages = data?.total_pages ?? page;
		page += 1;

		if (!results.length) {
			break;
		}
	}

	return items;
}

// sort by release date descending
const MOVIE_SORT = 'release_date.desc';
const TV_SORT = 'first_air_date.desc';

// filmography for an actor
export type Filmography = {
	movies: FilmSummary[];
	tv: FilmSummary[];
};

// get filmography for an actor
export async function getFilmographyForActor(actorId: number): Promise<Filmography> {
	const client = getClient();

  // builds output, movies and tv are sorted by release date descending
	const [moviesRaw, showsRaw] = await Promise.all([
		fetchAllPages<MovieResult>(client, '/discover/movie', {
			with_cast: actorId,
			sort_by: MOVIE_SORT
		}),
		fetchAllPages<TvResult>(client, '/discover/tv', {
			with_cast: actorId,
			sort_by: TV_SORT
		})
	]);

	const movies = moviesRaw.map(mapMovieToFilm).sort(sortByDateDesc);
	const tv = showsRaw.map(mapTvToFilm).sort(sortByDateDesc);

	return { movies, tv };
}

// normalises movie to film summary
function mapMovieToFilm(movie: MovieResult): FilmSummary {
	return {
		...movie,
		title: movie.title,
		media_type: 'movie'
	};
}

// normalises tv to film summary
function mapTvToFilm(show: TvResult): FilmSummary {
	return {
		id: show.id,
		title: show.name,
		release_date: show.first_air_date,
		overview: show.overview,
		poster_path: show.poster_path,
		popularity: show.popularity,
		vote_average: show.vote_average,
		media_type: 'tv'
	};
}

// sort by release date descending
function sortByDateDesc(a: FilmSummary, b: FilmSummary): number {
	const aDate = a.release_date ? Date.parse(a.release_date) : 0;
	const bDate = b.release_date ? Date.parse(b.release_date) : 0;
	return bDate - aDate;
}

