import express from 'express';
import cookieParser from 'cookie-parser';

import actorRoutes from './routes/actorRoutes.js';
import authRoutes from './routes/authRoutes.js';
import followRoutes from './routes/followRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/follow', followRoutes);
app.use('/health', healthRoutes);
app.use('/actors', actorRoutes);
app.use('/auth', authRoutes);

export default app;
