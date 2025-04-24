import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let payload;
  try {
    payload = verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data } = req.body;           // expects raw JSON blob from client
  if (!data) return res.status(400).json({ error: 'Missing data' });

  await prisma.save.upsert({
    where: { userId: payload.userId },
    update: { data },
    create: { userId: payload.userId, data }
  });

  res.status(200).json({ ok: true });
}
