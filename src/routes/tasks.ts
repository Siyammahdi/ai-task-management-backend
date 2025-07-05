import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.user!.userId);
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { user: true, subtasks: true },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.user!.userId);
    const taskId = Number(req.params.id);
    
    const task = await prisma.task.findFirst({
      where: { 
        id: taskId,
        userId 
      },
      include: { user: true, subtasks: true },
    });
    
    if (!task) { 
      res.status(404).json({ error: 'Task not found' }); 
      return; 
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, dueDate, subtasks } = req.body;
    const userId = parseInt(req.user!.userId);
    
    const created = await prisma.task.create({
      data: {
        title,
        description,
        status,
        dueDate: new Date(dueDate),
        userId,
        subtasks: subtasks && Array.isArray(subtasks)
          ? { create: subtasks.map((st: any) => ({ title: st.title, done: !!st.done })) }
          : undefined,
      },
      include: { user: true, subtasks: true },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, dueDate, subtasks } = req.body;
    const userId = parseInt(req.user!.userId);
    const taskId = Number(req.params.id);

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (title || description || status || dueDate) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(status && { status }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
      });
    }

    if (Array.isArray(subtasks)) {
      const dbSubtasks = await prisma.subTask.findMany({ where: { taskId } });
      const dbSubtaskIds = new Set(dbSubtasks.map(st => st.id));
      const reqSubtaskIds = new Set(subtasks.filter((st: any) => st.id).map((st: any) => Number(st.id)));

      await Promise.all(
        subtasks
          .filter((st: any) => st.id && dbSubtaskIds.has(Number(st.id)))
          .map((st: any) => prisma.subTask.update({
            where: { id: Number(st.id) },
            data: { title: st.title, done: !!st.done },
          }))
      );

      await Promise.all(
        subtasks
          .filter((st: any) => !st.id)
          .map((st: any) => prisma.subTask.create({
            data: { title: st.title, done: !!st.done, taskId },
          }))
      );

      await Promise.all(
        dbSubtasks
          .filter((st) => !reqSubtaskIds.has(st.id))
          .map((st) => prisma.subTask.delete({ where: { id: st.id } }))
      );
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { user: true, subtasks: true },
    });
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task or subtasks:', err);
    res.status(500).json({ error: 'Failed to update task', details: err instanceof Error ? err.message : err });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.user!.userId);
    const taskId = Number(req.params.id);

    // First check if the task belongs to the user
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router; 