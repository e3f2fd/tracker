import { DatabaseError } from 'pg';
import express from 'express';

import { authenticateUser, createUser, generateAuthToken, getUserById, verifyAuthToken } from '../services/authService.js';

const router = express.Router();

router.post('/register', async (req, res) => {
	const { username, password, displayName } = req.body ?? {};

	if (typeof username !== 'string' || typeof password !== 'string' || username.trim().length < 3 || password.length < 8) {
		res.status(400).json({ error: 'username and password required (username >= 3 chars, password >= 8 chars)' });
		return;
	}

	try {
		const user = await createUser({
			username: username.trim(),
			password,
			displayName: typeof displayName === 'string' ? displayName.trim() : null
		});
		const token = generateAuthToken(user);

		res.status(201).json({ token, user });
	} catch (err) {
		if (err instanceof DatabaseError && err.code === '23505') {
			res.status(409).json({ error: 'username already taken' });
			return;
		}

		console.error('failed to create account', err);
		res.status(500).json({ error: 'failed to create account' });
	}
});

router.post('/login', async (req, res) => {
	const { username, password } = req.body ?? {};

	if (typeof username !== 'string' || typeof password !== 'string') {
		res.status(400).json({ error: 'username and password required' });
		return;
	}

	try {
		const user = await authenticateUser({ username: username.trim(), password });

		if (!user) {
			res.status(401).json({ error: 'invalid credentials' });
			return;
		}

		const token = generateAuthToken(user);
		res.json({ token, user });
	} catch (err) {
		console.error('failed to login', err);
		res.status(500).json({ error: 'failed to login' });
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

