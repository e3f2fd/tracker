import { Issuer, Client, generators } from 'openid-client';

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '../config.js';

let googleClientPromise: Promise<Client> | null = null;

// gets the Google client
export async function getGoogleClient(): Promise<Client> {
	if (!googleClientPromise) {
		googleClientPromise = Issuer.discover('https://accounts.google.com').then(
			issuer =>
				new issuer.Client({
					client_id: GOOGLE_CLIENT_ID,
					client_secret: GOOGLE_CLIENT_SECRET,
					redirect_uris: [GOOGLE_REDIRECT_URI],
					response_types: ['code']
				})
		);
	}

	return googleClientPromise;
}

// creates a new OAuth state token
export function generateOAuthState(): string {
	return generators.state();
}

// creates a new OAuth nonce
export function generateOAuthNonce(): string {
	return generators.nonce();
}

