import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Sign up
router.post('/sign-up', async (req, res): Promise<void> => {
  try {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) {
      res.status(400).json({ error: 'All fields are required' }); return;
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'Username already exists' }); return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, username, password: hashed } });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

// Sign in
router.post('/sign-in', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'All fields are required' }); return;
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' }); return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' }); return;
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

export default router; 