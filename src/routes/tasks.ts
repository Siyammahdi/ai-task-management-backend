import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Get all tasks for the authenticated user (include subtasks)
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

// Get a single task by ID (include subtasks) - only if owned by user
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

// Create a new task (with optional subtasks)
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

// Update a task - only if owned by user
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, dueDate, subtasks } = req.body;
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

    // Update main task fields if provided
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

    // Full subtask editing
    if (Array.isArray(subtasks)) {
      const dbSubtasks = await prisma.subTask.findMany({ where: { taskId } });
      const dbSubtaskIds = new Set(dbSubtasks.map(st => st.id));
      const reqSubtaskIds = new Set(subtasks.filter((st: any) => st.id).map((st: any) => Number(st.id)));

      // 1. Update existing subtasks (title/done)
      await Promise.all(
        subtasks
          .filter((st: any) => st.id && dbSubtaskIds.has(Number(st.id)))
          .map((st: any) => prisma.subTask.update({
            where: { id: Number(st.id) },
            data: { title: st.title, done: !!st.done },
          }))
      );

      // 2. Create new subtasks (no id)
      await Promise.all(
        subtasks
          .filter((st: any) => !st.id)
          .map((st: any) => prisma.subTask.create({
            data: { title: st.title, done: !!st.done, taskId },
          }))
      );

      // 3. Delete removed subtasks (in DB but not in request)
      await Promise.all(
        dbSubtasks
          .filter((st) => !reqSubtaskIds.has(st.id))
          .map((st) => prisma.subTask.delete({ where: { id: st.id } }))
      );
    }

    // Return the updated task with fresh subtasks
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

// Delete a task - only if owned by user
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