"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Get all tasks for the authenticated user (include subtasks)
router.get('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.user.userId);
        const tasks = yield prisma.task.findMany({
            where: { userId },
            include: { user: true, subtasks: true },
        });
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
}));
// Get a single task by ID (include subtasks) - only if owned by user
router.get('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.user.userId);
        const taskId = Number(req.params.id);
        const task = yield prisma.task.findFirst({
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
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
}));
// Create a new task (with optional subtasks)
router.post('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, status, dueDate, subtasks } = req.body;
        const userId = parseInt(req.user.userId);
        const created = yield prisma.task.create({
            data: {
                title,
                description,
                status,
                dueDate: new Date(dueDate),
                userId,
                subtasks: subtasks && Array.isArray(subtasks)
                    ? { create: subtasks.map((st) => ({ title: st.title, done: !!st.done })) }
                    : undefined,
            },
            include: { user: true, subtasks: true },
        });
        res.status(201).json(created);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
}));
// Update a task - only if owned by user
router.put('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, status, dueDate, subtasks } = req.body;
        const userId = parseInt(req.user.userId);
        const taskId = Number(req.params.id);
        // First check if the task belongs to the user
        const existingTask = yield prisma.task.findFirst({
            where: { id: taskId, userId }
        });
        if (!existingTask) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        // Update main task fields if provided
        if (title || description || status || dueDate) {
            yield prisma.task.update({
                where: { id: taskId },
                data: Object.assign(Object.assign(Object.assign(Object.assign({}, (title && { title })), (description && { description })), (status && { status })), (dueDate && { dueDate: new Date(dueDate) })),
            });
        }
        // Full subtask editing
        if (Array.isArray(subtasks)) {
            const dbSubtasks = yield prisma.subTask.findMany({ where: { taskId } });
            const dbSubtaskIds = new Set(dbSubtasks.map(st => st.id));
            const reqSubtaskIds = new Set(subtasks.filter((st) => st.id).map((st) => Number(st.id)));
            // 1. Update existing subtasks (title/done)
            yield Promise.all(subtasks
                .filter((st) => st.id && dbSubtaskIds.has(Number(st.id)))
                .map((st) => prisma.subTask.update({
                where: { id: Number(st.id) },
                data: { title: st.title, done: !!st.done },
            })));
            // 2. Create new subtasks (no id)
            yield Promise.all(subtasks
                .filter((st) => !st.id)
                .map((st) => prisma.subTask.create({
                data: { title: st.title, done: !!st.done, taskId },
            })));
            // 3. Delete removed subtasks (in DB but not in request)
            yield Promise.all(dbSubtasks
                .filter((st) => !reqSubtaskIds.has(st.id))
                .map((st) => prisma.subTask.delete({ where: { id: st.id } })));
        }
        // Return the updated task with fresh subtasks
        const updatedTask = yield prisma.task.findUnique({
            where: { id: taskId },
            include: { user: true, subtasks: true },
        });
        res.json(updatedTask);
    }
    catch (err) {
        console.error('Error updating task or subtasks:', err);
        res.status(500).json({ error: 'Failed to update task', details: err instanceof Error ? err.message : err });
    }
}));
// Delete a task - only if owned by user
router.delete('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.user.userId);
        const taskId = Number(req.params.id);
        // First check if the task belongs to the user
        const existingTask = yield prisma.task.findFirst({
            where: { id: taskId, userId }
        });
        if (!existingTask) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        yield prisma.task.delete({
            where: { id: taskId },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
}));
exports.default = router;
