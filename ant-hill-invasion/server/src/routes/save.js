// server/src/routes/save.js
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import requireAuth from '../middleware/requireAuth.js';

const prisma = new PrismaClient();
const router  = Router();

/* -----  POST /api/save  ----- */
router.post('/save', requireAuth, async (req, res) => {
  const { data, score } = req.body;             // expects {data:{…}, score:123}
  await prisma.save.upsert({
    where:  { userId: req.user.sub },
    update: { data, score },
    create: { userId: req.user.sub, data, score }
  });
  res.json({ ok: true });
});

/* -----  GET /api/load  ----- */
router.get('/load', requireAuth, async (req, res) => {
  const save = await prisma.save.findFirst({
    where:   { userId: req.user.sub },
    orderBy: { updatedAt: 'desc' }
  });
  res.json(save ?? {});
});

export default router;
