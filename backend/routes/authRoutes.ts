import express from 'express';

import { GOOGLE_REDIRECT_URI } from '../config.js';
import { generateAuthToken, getUserById, upsertOAuthUser, verifyAuthToken } from '../services/authService.js';
import { generateOAuthNonce, generateOAuthState, getGoogleClient } from '../services/oauthClient.js';

const router = express.Router();

// begins the Google OAuth flow
router.get('/google/start', async (req, res) => {
	try {
		const client = await getGoogleClient();
		const state = generateOAuthState();
		const nonce = generateOAuthNonce();

		req.session.oauthState = state;
		req.session.oauthNonce = nonce;

		const authorizationUrl = client.authorizationUrl({
			scope: 'openid email profile',
			state,
			nonce,
			access_type: 'offline',
			prompt: 'consent'
		});

		res.json({ url: authorizationUrl });
	} catch (err) {
		console.error('failed to create google auth url', err);
		res.status(500).json({ error: 'failed to start oauth flow' });
	}
});

// handles the Google OAuth callback
router.get('/google/callback', async (req, res) => {
	try {
		const client = await getGoogleClient();
		const params = client.callbackParams(req);

		if (!req.session.oauthState || params.state !== req.session.oauthState) {
			res.status(400).json({ error: 'state mismatch' });
			return;
		}

		const tokenSet = await client.callback(
			GOOGLE_REDIRECT_URI,
			params,
			{
				state: req.session.oauthState,
				nonce: req.session.oauthNonce
			},
			{ exchangeBody: { code_verifier: params.code_verifier } }
		);

		const claims = tokenSet.claims();
		if (!claims.sub || !claims.email) {
			res.status(400).json({ error: 'missing user information from google' });
			return;
		}

		const user = await upsertOAuthUser({
			email: claims.email,
			displayName: claims.name ?? claims.email,
			provider: 'google',
			providerUserId: claims.sub,
			avatarUrl: claims.picture ?? null
		});

		const token = generateAuthToken(user);

		req.session.oauthState = undefined;
		req.session.oauthNonce = undefined;

		res.json({
			token,
			user
		});
	} catch (err) {
		console.error('google oauth callback failed', err);
		res.status(500).json({ error: 'oauth callback failed' });
	}
});

// fetches the authenticated user's profile
router.get('/me', async (req, res) => {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith('Bearer ')) {
		res.status(401).json({ error: 'unauthorised' });
		return;
	}

	try {
		const token = authHeader.substring('Bearer '.length);
		const payload = verifyAuthToken(token);
		const user = await getUserById(payload.sub);

		if (!user) {
			res.status(404).json({ error: 'user not found' });
			return;
		}

		res.json({ user });
	} catch (err) {
		console.error('failed to fetch current user', err);
		res.status(401).json({ error: 'invalid token' });
	}
});

export default router;

