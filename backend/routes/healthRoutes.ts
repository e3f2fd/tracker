import express from 'express';

import { query } from '../db.js';

const router = express.Router();

// lightweight liveness probe
router.get('/live', (_req, res) => {
	res.json({ ok: true });
});

// checks database connectivity
router.get('/db', async (_req, res) => {
	try {
		await query('SELECT 1');
		res.json({ ok: true });
	} catch (err) {
		console.error('database healthcheck failed', err);
		res.status(500).json({ ok: false });
	}
});

export default router;

