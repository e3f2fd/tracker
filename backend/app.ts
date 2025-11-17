import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { NODE_ENV, SESSION_SECRET } from './config.js';
import actorRoutes from './routes/actorRoutes.js';
import authRoutes from './routes/authRoutes.js';
import followRoutes from './routes/followRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: NODE_ENV === 'production',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 1000 * 60 * 60
		}
	})
);

// routes
app.use('/follow', followRoutes);
app.use('/health', healthRoutes);
app.use('/actors', actorRoutes);
app.use('/auth', authRoutes);

export default app;
