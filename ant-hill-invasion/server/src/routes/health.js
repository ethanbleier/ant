// server/src/routes/health.js
import { Router } from 'express';
export default Router().get('/health', (_req, res) => res.json({ status: 'ok' }));
