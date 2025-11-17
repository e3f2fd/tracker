import express from 'express';

import followRoutes from './routes/followRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import actorRoutes from './routes/actorRoutes.js';

const app = express();

// middleware
app.use(express.json());
// routes
app.use('/follow', followRoutes);
app.use('/health', healthRoutes);
app.use('/actors', actorRoutes);

// export app
export default app;

