import express from 'express';
import fetch from 'node-fetch';
import { Request, Response } from 'express';

const router = express.Router();

// POST /ai/suggestions
router.post('/suggestions', (req: Request, res: Response) => {
  (async () => {
    const { title, description, subtasks } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    
    const apiKey = process.env.GEMINI_API_KEY
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    // Compose the prompt for Gemini
    const prompt = `You are an expert task manager AI. Given the following task details, generate:
 - A very short but creative (90 words) breakdown of the task
 - Necessary Next steps to do the task in a proper way (90 words)
 - 5-7 Suggestions by breaking the task into smaller parts each breakdown suggestion should be a single short sentence, max 25 words)
 Keep the response concise, simple, and easy to read. Do not write long paragraphs.

 Task Title: ${title}
 Task Description: ${description}
 Subtasks: ${subtasks && subtasks.length > 0 ? subtasks.map((s: any) => s.title).join(', ') : 'None'}

 Respond in the following format:
 Breakdown:...
 Next Steps:...
 Suggestions:
 - ...
 - ...
 - ...`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const text = data.candidates[0].content.parts.map((p: any) => p.text).join('\n');
        return res.json({ suggestions: text });
      } else {
        console.error('Gemini API error response:', data);
        return res.status(500).json({ error: 'Failed to get suggestions from Gemini.', details: data });
      }
    } catch (error) {
      console.error('Gemini API request failed:', error);
      return res.status(500).json({ error: 'AI request failed.', details: error instanceof Error ? error.message : error });
    }
  })();
});

export default router; 