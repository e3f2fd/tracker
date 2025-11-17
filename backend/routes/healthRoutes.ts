import express from 'express';

import { query } from '../db.js';

const router = express.Router();

// checks the database health
router.get('/db', async (_req, res) => {
  // checks the database
	try {
		await query('SELECT 1');
  } catch (err) {
    console.error('database healthcheck failed', err);
    res.status(500).json({ ok: false });
    return;
  }

  // returns success
  res.json({ ok: true });
});

export default router;

