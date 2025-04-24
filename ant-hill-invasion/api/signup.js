import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({ data: { email, password: hash } });
    res.status(201).json({ id: user.id });
  } catch (e) {
    res.status(400).json({ error: 'User exists' });
  }
}
