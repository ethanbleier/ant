// server/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt    from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' };
const sign = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/* -----  POST /api/signup  ----- */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing data' });
  try {
    const pwHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, pwHash } });
    res.cookie('token', sign(user), COOKIE_OPTS).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Email already exists?' });
  }
});

/* -----  POST /api/login  ----- */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.pwHash)))
    return res.status(401).json({ error: 'Invalid creds' });

  res.cookie('token', sign(user), COOKIE_OPTS).json({ ok: true });
});

export default router;
