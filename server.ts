import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Timetable parsing endpoint
app.post('/api/parse-timetable', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    // Clean base64 data if it contains a data URL prefix
    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const prompt = `You are an expert college timetable analyzer. 
Analyze this timetable/class schedule image in detail.
Extract all lectures, laboratory sessions, practicals, tutorials, or seminars across all days of the week.
Identify:
1. Day of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday).
2. Subject name (clean, full name or recognizable title, e.g., 'Data Structures & Algorithms', 'Operating Systems', 'Machine Learning Lab').
3. Course/Subject code if visible (e.g., 'CS302', 'IT-201', 'MAT101').
4. Room number / Lab hall if visible (e.g., 'Room 401', 'LH-2', 'CSE Lab 3').
5. Faculty or professor name if visible.
6. Start Time and End Time in strictly 24-HOUR format 'HH:MM' (e.g., '09:00', '10:30', '13:00', '16:45'). If times are written in 12-hour AM/PM format (like 9:00 AM, 2:15 PM), convert them accurately to 24-hour time ('09:00', '14:15').
7. Type: 'lecture', 'lab', 'practical', 'tutorial', or 'seminar'.

Ensure that periods or time slots that span multiple columns/rows (e.g. 2-hour labs) have the correct full start time and end time.
If lunch break or recess is indicated, do not include it as a lecture, or tag it appropriately if needed, but prioritize academic periods with biometric punch requirements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scheduleName: {
              type: Type.STRING,
              description: 'Title or heading of timetable, semester, branch, or section if visible',
            },
            summary: {
              type: Type.STRING,
              description: 'Brief 1-sentence summary of the extracted schedule',
            },
            days: {
              type: Type.ARRAY,
              description: 'List of days containing lectures',
              items: {
                type: Type.OBJECT,
                properties: {
                  day: {
                    type: Type.STRING,
                    description: 'Full day name: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
                  },
                  lectures: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: {
                          type: Type.STRING,
                          description: 'Unique identifier for the lecture (e.g., mon-1)',
                        },
                        subject: {
                          type: Type.STRING,
                          description: 'Full subject or course name',
                        },
                        code: {
                          type: Type.STRING,
                          description: 'Subject code or abbreviation',
                        },
                        teacher: {
                          type: Type.STRING,
                          description: 'Faculty or instructor name if available',
                        },
                        room: {
                          type: Type.STRING,
                          description: 'Classroom, Hall, or Lab number',
                        },
                        type: {
                          type: Type.STRING,
                          description: 'Type: lecture, lab, practical, tutorial, seminar',
                        },
                        startTime: {
                          type: Type.STRING,
                          description: '24-hour start time format HH:MM (e.g. 09:30)',
                        },
                        endTime: {
                          type: Type.STRING,
                          description: '24-hour end time format HH:MM (e.g. 10:30)',
                        },
                      },
                      required: ['id', 'subject', 'startTime', 'endTime'],
                    },
                  },
                },
                required: ['day', 'lectures'],
              },
            },
          },
          required: ['scheduleName', 'days'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response generated by model');
    }

    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error parsing timetable image:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to parse timetable image with AI.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite or static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BioPunch server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
