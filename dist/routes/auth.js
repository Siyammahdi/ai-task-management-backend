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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
// Sign up
router.post('/sign-up', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, username, password } = req.body;
        if (!name || !email || !username || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const existing = yield prisma.user.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ error: 'Username already exists' });
            return;
        }
        const hashed = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma.user.create({ data: { name, email, username, password: hashed } });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username } });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to sign up' });
    }
}));
// Sign in
router.post('/sign-in', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const user = yield prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = yield bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, username: user.username } });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to sign in' });
    }
}));
exports.default = router;
