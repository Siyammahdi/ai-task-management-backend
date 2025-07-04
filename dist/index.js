"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/tasks', tasks_1.default);
app.use('/auth', auth_1.default);
app.use('/ai', ai_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// database pass: oBHQQKCAGIxBNbL3
//fxYja7TQqnAG4Y0w
// database string: postgresql://postgres:fxYja7TQqnAG4Y0w@db.bpqiwgwshxwneksgnxco.supabase.co:5432/postgres
