import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Get all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({ include: { user: true } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a single task by ID
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true },
    });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, status, dueDate, userId } = req.body;
    const task = await prisma.task.create({
      data: { title, description, status, dueDate: new Date(dueDate), userId },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { title, description, status, dueDate } = req.body;
    const task = await prisma.task.update({
      where: { id: Number(req.params.id) },
      data: { title, description, status, dueDate: new Date(dueDate) },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    await prisma.task.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router; 