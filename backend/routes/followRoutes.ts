import express from 'express';

import { saveFollow } from '../services/followService.js';

type FollowRequestBody = { userId: string; actorQuery?: string; actorId?: string };
type FollowResponseBody = { error?: string; ok: boolean };

const router = express.Router();

// saves a follow for an actor (by query or id)
router.post<unknown, FollowResponseBody, FollowRequestBody>('/', async (req, res) => {
	const { userId, actorQuery, actorId } = req.body;
	const query = actorQuery ?? actorId;

	if (!userId || !query) {
		res.status(400).json({ error: 'userId and query required', ok: false });
		return;
	}

  // saves the follow
  try {
    await saveFollow(userId, query);
  } catch (err) {
    console.error('failed to save follow', err);
    res.status(500).json({ error: 'failed to save follow', ok: false });
    return;
  }

  // returns success
  res.json({ ok: true });
});

export default router;

