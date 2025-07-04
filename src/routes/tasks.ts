import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Get all tasks (include subtasks)
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { user: true, subtasks: true },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a single task by ID (include subtasks)
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true, subtasks: true },
    });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task (with optional subtasks)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, status, dueDate, userId, subtasks } = req.body;
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

// Update a task
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { title, description, status, dueDate, subtasks } = req.body;
    // Update main task fields if provided
    if (title || description || status || dueDate) {
      await prisma.task.update({
        where: { id: Number(req.params.id) },
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
      const taskId = Number(req.params.id);
      const dbSubtasks = await prisma.subTask.findMany({ where: { taskId } });
      const dbSubtaskIds = new Set(dbSubtasks.map(st => st.id));
      const reqSubtaskIds = new Set(subtasks.filter((st: any) => st.id).map((st: any) => Number(st.id)));

      // 1. Update existing subtasks (title/done)
      await Promise.all(
        subtasks
          .filter((st: any) => st.id && dbSubtaskIds.has(Number(st.id)))
          .map((st: any) =>
            prisma.subTask.update({
              where: { id: Number(st.id) },
              data: { title: st.title, done: !!st.done },
            })
          )
      );
      // 2. Create new subtasks (no id)
      await Promise.all(
        subtasks
          .filter((st: any) => !st.id)
          .map((st: any) =>
            prisma.subTask.create({
              data: { title: st.title, done: !!st.done, taskId },
            })
          )
      );
      // 3. Delete removed subtasks (in DB but not in request)
      await Promise.all(
        dbSubtasks
          .filter((st: any) => !reqSubtaskIds.has(st.id))
          .map((st: any) =>
            prisma.subTask.delete({ where: { id: st.id } })
          )
      );
    }

    // Return the updated task with fresh subtasks
    const updatedTask = await prisma.task.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true, subtasks: true },
    });
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task or subtasks:', err);
    res.status(500).json({ error: 'Failed to update task', details: err instanceof Error ? err.message : err });
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