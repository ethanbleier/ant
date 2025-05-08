// server/src/routes/save.js
import { Router } from 'express';
import { prisma } from '../prismaClient.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

/* ──────────  POST /api/save  ──────────
   Body: { level: 1, score: 250, data: { towers:3, hp:60 } }
   Upserts by (userId, level) so the player has one row per level.
──────────────────────────────────────── */
router.post('/save', requireAuth, async (req, res) => {
  const { level, score, data } = req.body;      // ←  level REQUIRED
  const userId = req.user.id;                   // set in requireAuth

  await prisma.save.upsert({
    where : { userId_level: { userId, level } }, // composite unique key
    update: { score, data },
    create: { userId, level, score, data }
  });

  res.json({ ok: true });
});

/* ──────────  GET /api/load  ──────────
   Returns all saves for the signed-in user, newest first.
──────────────────────────────────────── */
router.get('/load', requireAuth, async (req, res) => {
  const saves = await prisma.save.findMany({
    where   : { userId: req.user.id },
    orderBy : { updatedAt: 'desc' }
  });
  res.json(saves);
});

export default router;
