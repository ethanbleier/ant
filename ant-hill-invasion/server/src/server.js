import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

import authRoutes   from './routes/auth.js';
import saveRoutes   from './routes/save.js';
import healthRoutes from './routes/health.js';
import progressRoutes from './routes/progress.js';

app.use('/api', progressRoutes);
app.use('/api', authRoutes);
app.use('/api', saveRoutes);
app.use('/api', healthRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`API up at http://localhost:${PORT}`));

