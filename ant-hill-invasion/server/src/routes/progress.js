import express from 'express';
import { prisma } from '../prismaClient.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

/* ----------  POST /api/save  ---------------------------------
   Upserts by (userId, level) so one row per level per player.
---------------------------------------------------------------- */
router.post('/save', requireAuth, async (req, res) => {
  const { level, score, data } = req.body;
  await prisma.save.upsert({
    where : { userId_level: { userId: req.user.id, level } },
    update: { score, data },
    create: { userId: req.user.id, level, score, data }
  });
  res.json({ ok: true });
});

/* ----------  GET /api/load  ----------------------------------
   returns all saves for the current user
---------------------------------------------------------------- */
router.get('/load', requireAuth, async (req, res) => {
  const saves = await prisma.save.findMany({
    where : { userId: req.user.id },
    orderBy: { level: 'asc' }
  });
  res.json(saves);
});

/* ----------  GET /api/progress  -------------------------------
   trimmed view for a “Campaign / Stats” screen
---------------------------------------------------------------- */
router.get('/progress', requireAuth, async (req, res) => {
  const rows = await prisma.save.findMany({
    where : { userId: req.user.id },
    select: { level:true, score:true, updatedAt:true },
    orderBy: { level:'asc' }
  });
  res.json(rows);
});

export default router;
