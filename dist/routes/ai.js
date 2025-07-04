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
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = express_1.default.Router();
// POST /ai/suggestions
router.post('/suggestions', (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const { title, description, subtasks } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }
        const apiKey = 'AIzaSyAyGhfJb-nPTQgWx2xEfmzTTprgz1yGXJA';
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
        // Compose the prompt for Gemini
        const prompt = `You are an expert project manager AI. Given the following task details, generate:
- A 2-3 sentence breakdown of the task
- Next steps
- Suggestions for breaking the task into smaller parts
- Bullet points for each suggestion

Task Title: ${title}
Task Description: ${description}
Subtasks: ${subtasks && subtasks.length > 0 ? subtasks.map((s) => s.title).join(', ') : 'None'}

Respond in the following format:
Breakdown: ...
Next Steps: ...
Suggestions:
- ...
- ...
- ...`;
        try {
            const response = yield (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });
            const data = yield response.json();
            if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const text = data.candidates[0].content.parts.map((p) => p.text).join('\n');
                return res.json({ suggestions: text });
            }
            else {
                return res.status(500).json({ error: 'Failed to get suggestions from Gemini.' });
            }
        }
        catch (error) {
            return res.status(500).json({ error: 'AI request failed.' });
        }
    }))();
});
exports.default = router;
