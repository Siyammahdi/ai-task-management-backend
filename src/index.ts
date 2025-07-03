import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tasksRouter from './routes/tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 



// database pass: oBHQQKCAGIxBNbL3
//fxYja7TQqnAG4Y0w
// database string: postgresql://postgres:fxYja7TQqnAG4Y0w@db.bpqiwgwshxwneksgnxco.supabase.co:5432/postgres