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
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Get all tasks (include subtasks)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tasks = yield prisma.task.findMany({
            include: { user: true, subtasks: true },
        });
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
}));
// Get a single task by ID (include subtasks)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = yield prisma.task.findUnique({
            where: { id: Number(req.params.id) },
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
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, status, dueDate, userId, subtasks } = req.body;
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
// Update a task
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, status, dueDate, subtasks } = req.body;
        // Update main task fields if provided
        if (title || description || status || dueDate) {
            yield prisma.task.update({
                where: { id: Number(req.params.id) },
                data: Object.assign(Object.assign(Object.assign(Object.assign({}, (title && { title })), (description && { description })), (status && { status })), (dueDate && { dueDate: new Date(dueDate) })),
            });
        }
        // Full subtask editing
        if (Array.isArray(subtasks)) {
            const taskId = Number(req.params.id);
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
            where: { id: Number(req.params.id) },
            include: { user: true, subtasks: true },
        });
        res.json(updatedTask);
    }
    catch (err) {
        console.error('Error updating task or subtasks:', err);
        res.status(500).json({ error: 'Failed to update task', details: err instanceof Error ? err.message : err });
    }
}));
// Delete a task
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.task.delete({ where: { id: Number(req.params.id) } });
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
}));
exports.default = router;
