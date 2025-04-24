import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let payload;
  try {
    payload = verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const save = await prisma.save.findUnique({
    where: { userId: payload.userId }
  });

  res.status(200).json({ data: save ? save.data : null });
}
