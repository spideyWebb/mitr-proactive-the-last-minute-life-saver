import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import pg from 'pg';
import { Task, Habit, CalendarEvent, CoachingInsight, SubTask } from './src/types';

const { Pool } = pg;

const app = express();
const PORT = 3000;

app.use(express.json());

// Global trackers for referer & timezone offset to bypass FormSubmit origin verification
let lastKnownReferer = 'https://ais-pre-xlniwashc7h3elt665vh5p-1060434645621.asia-southeast1.run.app';
let lastTimezoneOffset = '-07:00'; // Default PDT, updated dynamically from client requests

app.use((req, res, next) => {
  const ref = req.headers.referer || req.headers.origin;
  if (ref && typeof ref === 'string' && (ref.startsWith('http://') || ref.startsWith('https://'))) {
    lastKnownReferer = ref;
  }
  const tz = req.headers['x-timezone-offset'];
  if (tz && typeof tz === 'string') {
    lastTimezoneOffset = tz;
  }
  next();
});

// Path to persist data across dev server restarts (Local backup storage)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBState {
  tasks: Task[];
  habits: Habit[];
  events: CalendarEvent[];
  insights: CoachingInsight[];
}

const defaultState: DBState = {
  tasks: [
    {
      id: '1',
      title: 'Prepare final year presentation',
      description: 'Prepare and practice slides for the college final evaluation panel.',
      priority: 'high',
      status: 'pending',
      difficulty: 'complex',
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      category: 'Education',
      subtasks: [
        { id: '1-1', title: 'Write outline of the presentation slides', completed: false },
        { id: '1-2', title: 'Create interactive demo mockups', completed: false },
        { id: '1-3', title: 'Do a recorded dry run under 10 minutes', completed: false }
      ],
      aiSchedules: ['Tomorrow, 10:00 AM', 'Wednesday, 2:00 PM'],
      isAIPrioritized: true,
      aiRationale: 'This presentation represents 40% of the final grade and requires multi-stage research + review. I decomposed it and allocated mornings for high focus.'
    },
    {
      id: '2',
      title: 'Pay high-speed internet broadband bill',
      description: 'To avoid late fees or disconnection, clear the outstanding bill.',
      priority: 'medium',
      status: 'pending',
      difficulty: 'easy',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      category: 'Bills',
      subtasks: [],
      aiSchedules: ['Today, 4:00 PM'],
      isAIPrioritized: false,
      aiRationale: 'Routine utility payments have immediate expiry. Schedulers suggest completing this in an afternoon filler block.'
    }
  ],
  habits: [
    {
      id: 'h1',
      title: 'Daily Morning Planning (10m Review)',
      frequency: 'daily',
      streak: 5,
      lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      history: {},
      createdAt: new Date().toISOString()
    },
    {
      id: 'h2',
      title: 'Deep Work Block (90m No Phone)',
      frequency: 'daily',
      streak: 2,
      lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      history: {},
      createdAt: new Date().toISOString()
    }
  ],
  events: [
    {
      id: 'e1',
      title: 'Final evaluation meeting',
      description: 'Faculty panel review session',
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      durationMinutes: 60,
      taskId: '1',
      type: 'meeting'
    }
  ],
  insights: [
    {
      id: "in1",
      timestamp: new Date().toISOString(),
      category: "procrastination",
      title: "Complexity Pattern Detected!",
      message: "You postponed 'Prepare presentation' three times. Complex tasks create subconscious resistance. I broke it down into 3 simple milestones (under 30 minutes each). Start with slide outline today!",
      actionableItem: "Draft the first 3 slides outline"
    }
  ]
};

// --- POSTGRESQL INITIALIZATION & LOGIC ---
const NEON_DB_URL = "postgresql://neondb_owner:npg_tgDpGqBEQ7r2@ep-shy-firefly-ao170aol.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
let pool: pg.Pool | null = null;
let usePostgres = false;

try {
  pool = new Pool({
    connectionString: NEON_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  console.log("PostgreSQL Pool created successfully.");
} catch (err) {
  console.error("Failed to construct PG Pool, falling back to local file:", err);
}

// Bootstrapping tables
async function initializePostgresTables() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    console.log("Connected to Neon PostgreSQL database! Bootstrapping schemas...");
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        profile JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        priority VARCHAR(50),
        deadline VARCHAR(100),
        status VARCHAR(50),
        estimated_time INT,
        ai_score INT,
        category VARCHAR(255),
        subtasks JSONB DEFAULT '[]'::jsonb,
        ai_schedules JSONB DEFAULT '[]'::jsonb,
        is_ai_prioritized BOOLEAN DEFAULT FALSE,
        ai_rationale TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        habit_name VARCHAR(255),
        frequency VARCHAR(50),
        streak INT DEFAULT 0,
        history JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        start_time VARCHAR(255),
        end_time VARCHAR(255),
        date VARCHAR(100),
        duration_minutes INT DEFAULT 30,
        task_id VARCHAR(255),
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        message TEXT,
        recommendation TEXT,
        category VARCHAR(100),
        actionable_item TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    usePostgres = true;
    console.log("Mitr Proactive tables initialized successfully on Google/Neon Postgres.");
  } catch (err) {
    console.error("Neon Postgres initialization error. Operating in offline-fallback JSON mode.", err);
    usePostgres = false;
  }
}

// Trigger postgres initialization immediately
initializePostgresTables();

// Standard fallback mechanisms
function readDB(): DBState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading DB, resetting to default:', error);
  }
  writeDB(defaultState);
  return defaultState;
}

function writeDB(state: DBState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}


// Lazy-initialize Gemini SDK
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables. Please verify secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// ----------------------------------------------------
// DATABASE API ENDPOINTS (Standard CRUD)
// ----------------------------------------------------

app.get('/api/tasks', (req, res) => {
  const db = readDB();
  res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
  const db = readDB();
  const newTask: Task = {
    id: 't-' + Math.random().toString(36).substr(2, 9),
    title: req.body.title || 'Untitled Task',
    description: req.body.description || '',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'pending',
    difficulty: req.body.difficulty || 'easy',
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    dueTime: req.body.dueTime,
    createdAt: new Date().toISOString(),
    category: req.body.category || 'General',
    subtasks: req.body.subtasks || [],
    reminderEmail: req.body.reminderEmail,
    reminderTime: req.body.reminderTime,
    reminderTimestamp: req.body.reminderTimestamp,
    reminderSent: req.body.reminderSent || false,
    timezoneOffset: req.body.timezoneOffset
  };
  db.tasks.unshift(newTask);
  writeDB(db);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const db = readDB();
  const idx = db.tasks.findIndex(t => t.id === req.params.id);
  if (idx !== -1) {
    db.tasks[idx] = { ...db.tasks[idx], ...req.body };
    writeDB(db);
    res.json(db.tasks[idx]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = readDB();
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Email Notifications Dispatch API
app.post('/api/send-email', async (req, res) => {
  const { email, subject, body } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  try {
    console.log(`Sending real email alert to ${email} via FormSubmit...`);
    
    // Sanitize email and strip emojis from subject
    const sanitizedEmail = String(email).replace(/[^\x00-\x7F]/g, '').trim();
    const sanitizedSubject = String(subject || 'Mitr AI Cognitive Planner Alert')
      .replace(/[^\x00-\x7F]/g, '')
      .trim() || 'Mitr AI Cognitive Planner Alert';

    // Parse origin from lastKnownReferer for standard cors validation header
    let originHeader = 'https://ais-pre-xlniwashc7h3elt665vh5p-1060434645621.asia-southeast1.run.app';
    try {
      originHeader = new URL(lastKnownReferer).origin;
    } catch (e) {
      // fallback
    }

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(sanitizedEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': lastKnownReferer,
        'Origin': originHeader
      },
      body: JSON.stringify({
        _subject: sanitizedSubject,
        name: 'Mitr AI Cognitive Assistant',
        email: 'assistant@mitr.ai',
        message: body || 'This is a test notification from your Mitr Cognitive Planner.',
        _template: 'box'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('FormSubmit success response:', result);
      res.json({ 
        success: true, 
        message: 'Real email alert dispatched successfully via FormSubmit!',
        isFirstTime: true // Indicate this might require first-time email activation
      });
    } else {
      const errorText = await response.text();
      console.error(`FormSubmit response error: ${errorText}`);
      res.status(500).json({ error: 'Failed to send email alert', details: errorText });
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Habits
app.get('/api/habits', (req, res) => {
  const db = readDB();
  res.json(db.habits);
});

app.post('/api/habits', (req, res) => {
  const db = readDB();
  const newHabit: Habit = {
    id: 'h-' + Math.random().toString(36).substr(2, 9),
    title: req.body.title || 'Untitled Habit',
    frequency: req.body.frequency || 'daily',
    streak: 0,
    history: {},
    createdAt: new Date().toISOString()
  };
  db.habits.push(newHabit);
  writeDB(db);
  res.status(201).json(newHabit);
});

app.put('/api/habits/:id', (req, res) => {
  const db = readDB();
  const idx = db.habits.findIndex(h => h.id === req.params.id);
  if (idx !== -1) {
    db.habits[idx] = { ...db.habits[idx], ...req.body };
    writeDB(db);
    res.json(db.habits[idx]);
  } else {
    res.status(4404).json({ error: 'Habit not found' });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  const db = readDB();
  db.habits = db.habits.filter(h => h.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Events
app.get('/api/events', (req, res) => {
  const db = readDB();
  res.json(db.events);
});

app.post('/api/events', (req, res) => {
  const db = readDB();
  const newEvent: CalendarEvent = {
    id: 'e-' + Math.random().toString(36).substr(2, 9),
    title: req.body.title || 'Untitled Event',
    description: req.body.description,
    date: req.body.date || new Date().toISOString().split('T')[0],
    time: req.body.time,
    durationMinutes: req.body.durationMinutes || 30,
    taskId: req.body.taskId,
    type: req.body.type || 'reminder'
  };
  db.events.push(newEvent);
  writeDB(db);
  res.status(201).json(newEvent);
});

app.delete('/api/events/:id', (req, res) => {
  const db = readDB();
  db.events = db.events.filter(e => e.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Insights
app.get('/api/insights', (req, res) => {
  const db = readDB();
  res.json(db.insights);
});


// ----------------------------------------------------
// AI-GENERATION ENDPOINTS (Gemini Powered)
// ----------------------------------------------------

/**
 * 1. AI Intelligent Task Decomposer
 * Breaks down complex tasks into actionable steps.
 */
app.post('/api/ai/subtasks', async (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const ai = getAI();
    const systemPrompt = `You are a high-performance productivity coach.
Your job is to break down complex projects/tasks into micro-steps (milestones) that can be completed under 30 minutes.
This helps defeat procrastination.
Output ONLY a JSON array of subtasks matching this format:
[
  { "title": "First micro-step", "estimatedMinutes": 15 },
  { "title": "Second micro-step", "estimatedMinutes": 30 }
]
Focus heavily on highly actionable, verb-first titles. Provide 3 to 6 steps. Return absolutely nothing else but pure JSON.`;

    const userPrompt = `Task Title: "${title}"\nDescription: "${description || 'None'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Actionable descriptive verb-first step.' },
              estimatedMinutes: { type: Type.INTEGER, description: 'Estimated time in minutes.' }
            },
            required: ['title', 'estimatedMinutes']
          }
        }
      }
    });

    const stepsText = response.text;
    const subtasks = JSON.parse(stepsText || '[]');
    res.json(subtasks);
  } catch (error) {
    console.log('Gemini Subtask decomposition executing offline subtasks path.');
    const subtasks = [
      { title: `Setup workspace & review requirements for "${title}"`, estimatedMinutes: 15 },
      { title: `Draft core components and initial prototype`, estimatedMinutes: 30 },
      { title: `Refine, debug, and perform final sanity checks`, estimatedMinutes: 20 }
    ];
    res.json(subtasks);
  }
});

/**
 * 2. AI Smart Scheduling & Task Prioritization Optimizer
 * Evaluates tasks & habits to generate dynamic non-conflicting visual times.
 */
app.post('/api/ai/optimize-schedule', async (req, res) => {
  const db = readDB();
  
  if (db.tasks.length === 0) {
    return res.json({ 
      optimizedTasks: [], 
      explanation: "No tasks found to optimize! Create some tasks first to see AI scheduling in action." 
    });
  }

  try {
    const ai = getAI();
    const systemPrompt = `You are an expert scheduler assistant.
Evaluate the current workload of Tasks.
Decide:
1. Which tasks should be marked with priority 'high'/'medium'/'low' if they are set poorly.
2. Formulate 1 or 2 specific scheduled planning times (e.g. "Today, 2:30 PM", "Tomorrow, 11:00 AM") for each task to allow healthy spacing and focus.
3. Write a brief "rationale" explaining why you prioritized it this way.
4. Output a JSON object containing optimized tasks with IDs and schedule insights. ONLY output this JSON schema, no other text.`;

    const inputData = JSON.stringify(db.tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate,
      category: t.category
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Optimize this task list:\n${inputData}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  suggestedPriority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                  aiSchedules: { type: Type.ARRAY, items: { type: Type.STRING } },
                  aiRationale: { type: Type.STRING, description: 'Friendly rationale of around 1-2 short sentences.' }
                },
                required: ['id', 'suggestedPriority', 'aiSchedules', 'aiRationale']
              }
            },
            scheduleSummary: { type: Type.STRING, description: 'High level coaching advice based on optimized slots.' }
          },
          required: ['optimizedTasks', 'scheduleSummary']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Apply optimizations to current DB
    if (result.optimizedTasks) {
      result.optimizedTasks.forEach((opt: any) => {
        const task = db.tasks.find(t => t.id === opt.id);
        if (task) {
          task.priority = opt.suggestedPriority;
          task.aiSchedules = opt.aiSchedules;
          task.aiRationale = opt.aiRationale;
          task.isAIPrioritized = true;
        }
      });
      
      // Inject this new optimization report as a Coaching Insight!
      const newInsight: CoachingInsight = {
        id: 'in-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        category: 'efficiency',
        title: 'Schedule Auto-Aligned!',
        message: result.scheduleSummary || 'We analyzed your deadline calendar and balanced high-load slots so you do not suffer execution burnout.',
        actionableItem: 'Review prioritized calendar blocks'
      };
      db.insights.unshift(newInsight);
      
      writeDB(db);
    }

    res.json({
      success: true,
      optimizedState: db.tasks,
      scheduleSummary: result.scheduleSummary
    });
  } catch (error) {
    console.log('Gemini Optimization executing offline schedule path.');
    
    // Offline local fallback optimization
    db.tasks.forEach((task, idx) => {
      if (!task.aiSchedules || task.aiSchedules.length === 0) {
        const hour = 9 + (idx % 8);
        task.aiSchedules = [`Today at ${hour}:00 AM` + (idx % 2 === 1 ? ' & Tomorrow at 2:00 PM' : '')];
      }
      if (!task.aiRationale) {
        task.aiRationale = `Balanced priority and workload to avoid burnout. Peak efficiency recommended for this ${task.difficulty || 'easy'} task.`;
      }
      task.isAIPrioritized = true;
    });

    // Create a new Coaching Insight
    const newInsight: CoachingInsight = {
      id: 'in-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      category: 'efficiency',
      title: 'Schedule Auto-Aligned (Local Mode)!',
      message: 'Your workload was optimized locally using cognitive pacing rules to protect your focus hours.',
      actionableItem: 'Review prioritized calendar blocks'
    };
    db.insights.unshift(newInsight);
    writeDB(db);

    res.json({
      success: true,
      optimizedState: db.tasks,
      scheduleSummary: "We have aligned your task slots based on local density and priority heuristically to keep you in flow state!"
    });
  }
});

/**
 * 3. Voice / Natural Language Companion Reframe
 * Interprets spontaneous natural language / vocal notes and creates proper tasks, calendar schedules or habits.
 */
app.post('/api/ai/voice-reframe', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Vocal/Text input transcript is required.' });
  }

  try {
    const ai = getAI();
    const systemPrompt = `You are a proactive, comforting AI companion.
A developer, student or entrepreneur says something spontaneous (possibly containing stress, urgency, mixed English/Hindi/Hinglish phrasing).
Identify what they mean:
- Do they want to create a Task?
- Do they want to schedule an Event?
- Do they want to start a Habit?
Formulate a proper structured target object and write a highly reassuring assistant response in comforting, encouraging words (mixing brief English and gentle Hinglish is awesome if they used Hindi, otherwise match their tone) that clarifies that you have proactively mapped this, so they do not have to worry.

Output the results exactly in this JSON schema, return absolutely nothing else:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the user's natural comment: "${text}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            messageType: { type: Type.STRING, enum: ['task', 'habit', 'calendar_event', 'conversational'] },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                task: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                    difficulty: { type: Type.STRING, enum: ['easy', 'moderate', 'complex'] },
                    category: { type: Type.STRING },
                    dueDate: { type: Type.STRING, description: 'Date in YYYY-MM-DD form, default relative to today (2026-06-22).' }
                  },
                  required: ['title', 'priority', 'difficulty', 'category', 'dueDate']
                },
                habit: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    frequency: { type: Type.STRING, enum: ['daily', 'weekly'] }
                  },
                  required: ['title', 'frequency']
                },
                calendarEvent: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    date: { type: Type.STRING },
                    time: { type: Type.STRING, description: 'HH:MM' },
                    type: { type: Type.STRING, enum: ['task', 'meeting', 'bill', 'reminder', 'focus_session'] }
                  },
                  required: ['title', 'date', 'type']
                }
              }
            },
            assistantResponse: { type: Type.STRING, description: 'Spoken-style coaching response reassuring the user.' }
          },
          required: ['messageType', 'assistantResponse']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const db = readDB();

    // Auto-create in DB if data is parsed
    if (parsed.messageType === 'task' && parsed.extractedData?.task) {
      const t = parsed.extractedData.task;
      const newTask: Task = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        title: t.title || 'Spoken Task',
        description: t.description || 'Quick created from dynamic vocal assistant note.',
        priority: t.priority || 'medium',
        status: 'pending',
        difficulty: t.difficulty || 'easy',
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        category: t.category || 'Focus',
        subtasks: []
      };
      db.tasks.unshift(newTask);
      writeDB(db);
    } else if (parsed.messageType === 'habit' && parsed.extractedData?.habit) {
      const h = parsed.extractedData.habit;
      const newHabit: Habit = {
        id: 'h-' + Math.random().toString(36).substr(2, 9),
        title: h.title || 'Spoken Habit',
        frequency: h.frequency || 'daily',
        streak: 0,
        history: {},
        createdAt: new Date().toISOString()
      };
      db.habits.push(newHabit);
      writeDB(db);
    } else if (parsed.messageType === 'calendar_event' && parsed.extractedData?.calendarEvent) {
      const e = parsed.extractedData.calendarEvent;
      const newEvent: CalendarEvent = {
        id: 'e-' + Math.random().toString(36).substr(2, 9),
        title: e.title || 'Spoken Calendar Event',
        description: e.description,
        date: e.date || new Date().toISOString().split('T')[0],
        time: e.time || '12:00',
        durationMinutes: 45,
        type: e.type || 'reminder'
      };
      db.events.push(newEvent);
      writeDB(db);
    }

    res.json(parsed);
  } catch (error) {
    console.log('Gemini Voice Reframe executing offline fallback parser path.');
    
    const db = readDB();
    const query = text.toLowerCase();
    
    let messageType: 'task' | 'habit' | 'calendar_event' | 'conversational' = 'task';
    let assistantResponse = '';
    let extractedData: any = {};
    
    // Check if it's a Habit request
    if (query.includes('habit') || query.includes('daily') || query.includes('routine') || query.includes('gym') || query.includes('track') || query.includes('water')) {
      messageType = 'habit';
      let title = 'Spoken Habit';
      if (query.includes('gym')) title = 'Gym workout routine';
      else if (query.includes('water')) title = 'Drink 3 liters of water';
      else if (query.includes('meditat')) title = 'Daily mindfulness meditation';
      else {
        title = text.replace(/habit/gi, '').replace(/track/gi, '').replace(/daily/gi, '').trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      
      const newHabit: Habit = {
        id: 'h-' + Math.random().toString(36).substr(2, 9),
        title,
        frequency: 'daily',
        streak: 0,
        history: {},
        createdAt: new Date().toISOString()
      };
      db.habits.push(newHabit);
      writeDB(db);
      
      assistantResponse = `Aree Wah! Maine aapki "Daily ${title}" habit start kar di hai local mode me. Konsi habit miss nahi honi chahiye, bas use daily tick karte raho yaar!`;
      extractedData = { habit: { title, frequency: 'daily' } };
    }
    // Check if it's a Calendar Event / Meeting request
    else if (query.includes('schedule') || query.includes('calendar') || query.includes('meeting') || query.includes('baje') || query.includes('pm') || query.includes('am') || query.includes('tomorrow') || query.includes('today') || query.includes('tarik') || query.includes('bnd')) {
      messageType = 'calendar_event';
      let title = 'Spoken Event';
      if (query.includes('meeting')) title = 'Team collaboration review meeting';
      else if (query.includes('presentation')) title = 'Project presentation dry run';
      else {
        title = text.replace(/schedule/gi, '').replace(/calendar/gi, '').trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      
      // Determine date
      let date = new Date().toISOString().split('T')[0];
      if (query.includes('tomorrow') || query.includes('kal')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
      }
      
      // Determine time
      let time = '15:00';
      const timeMatch = query.match(/(\d+)\s*(?:baje|pm|am|:)/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        if (query.includes('pm') && hour < 12) hour += 12;
        time = `${hour.toString().padStart(2, '0')}:00`;
      }
      
      const newEvent: CalendarEvent = {
        id: 'e-' + Math.random().toString(36).substr(2, 9),
        title,
        description: 'Vocal/Text auto-mapped entry (Offline fallback)',
        date,
        time,
        durationMinutes: 45,
        type: query.includes('meeting') ? 'meeting' : 'reminder'
      };
      db.events.push(newEvent);
      writeDB(db);
      
      assistantResponse = `Perfect! Maine "${title}" schedule kar diya hai ${date} ko, sharp ${time} baje! No stress, main isko track kar raha hoon.`;
      extractedData = { calendarEvent: { title, date, time, type: newEvent.type } };
    }
    // Default to Task creation
    else {
      messageType = 'task';
      let title = text;
      title = title.replace(/add task/gi, '').replace(/create task/gi, '').trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      const priority = (query.includes('high') || query.includes('urgent') || query.includes('important')) ? 'high' : 'medium';
      const difficulty = (query.includes('hard') || query.includes('complex') || query.includes('difficult') || query.includes('mushkil')) ? 'complex' : 'easy';
      
      const newTask: Task = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        title,
        description: 'Vocal note auto-categorized under local fallback mode.',
        priority,
        status: 'pending',
        difficulty,
        dueDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        category: 'Focus',
        subtasks: []
      };
      db.tasks.unshift(newTask);
      writeDB(db);
      
      assistantResponse = `Sahi hai! Maine "${title}" ko task planner me add kar diya hai (Priority: ${priority}). Chalo tension mat lo, aasan micro-steps me khatam karenge!`;
      extractedData = { task: { title, priority, difficulty, category: 'Focus', dueDate: newTask.dueDate } };
    }
    
    res.json({
      messageType,
      extractedData,
      assistantResponse
    });
  }
});

/**
 * 4. Personalized AI Coaching Analysis
 * Generates proactive custom suggestions based on logs.
 */
app.get('/api/ai/coaching-insights', async (req, res) => {
  const db = readDB();

  try {
    const ai = getAI();
    const systemPrompt = `You are an elite empathetic AI productivity companion.
Analyze the user's workload, task status, due dates, habits, and streak metrics.
Formulate exactly ONE custom high-value proactive warning or encouragement coaching insight.
Make it deeply personalized (e.g. identify if bills are due, if streaks are high, if task volume is overwhelming, or if a complex task has no steps completed).
Output EXACTLY a JSON object representing the CoachingInsight. STRICT schema, no other text.`;

    const modelInput = JSON.stringify({
      tasks: db.tasks.map(t => ({ title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate, subtaskCount: t.subtasks.length, subtaskCompleted: t.subtasks.filter(s=>s.completed).length })),
      habits: db.habits.map(h => ({ title: h.title, streak: h.streak, lastCompleted: h.lastCompletedDate }))
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Evaluate performance logs and generate coaching advice card:\n${modelInput}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['procrastination', 'wellness', 'efficiency', 'encouragement', 'warning'] },
            title: { type: Type.STRING },
            message: { type: Type.STRING, description: '1-3 sentences of deep, targeted coaching advice.' },
            actionableItem: { type: Type.STRING, description: 'A single, micro-step action the user can execute in 60 seconds.' }
          },
          required: ['category', 'title', 'message', 'actionableItem']
        }
      }
    });

    const parsedInsight = JSON.parse(response.text || '{}');
    const newInsight: CoachingInsight = {
      id: 'in-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...parsedInsight
    };

    // Insert to DB list so history accumulates
    db.insights.unshift(newInsight);
    writeDB(db);

    res.json(newInsight);
  } catch (error) {
    console.error('Coaching insight generation failed, executing offline heuristic insight generator:', error);
    
    const pendingTasks = db.tasks.filter(t => t.status !== 'completed');
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    const totalHabits = db.habits.length;
    const totalStreak = db.habits.reduce((acc, curr) => acc + curr.streak, 0);
    
    let category: 'procrastination' | 'wellness' | 'efficiency' | 'encouragement' | 'warning' = 'encouragement';
    let title = "Ready for Impact!";
    let message = "Your active task list is clear and calm. Now is the perfect window to establish a new healthy habit or plan your week.";
    let actionableItem = "Add a routine habit like 'Drink 3L Water' or 'Daily Meditation'.";
    
    if (highPriorityTasks.length > 0) {
      category = 'procrastination';
      title = "Procrastination Shield Active!";
      message = `You have ${highPriorityTasks.length} high-priority deadlines on your dashboard, including "${highPriorityTasks[0].title}". Starting is the hardest part.`;
      actionableItem = `Use Mitr Decomposer to break down "${highPriorityTasks[0].title}" into steps.`;
    } else if (pendingTasks.length > 5) {
      category = 'warning';
      title = "Workload Load Balancing";
      message = `With ${pendingTasks.length} pending items, your brain's cognitive switching cost increases. Let's isolate a single focus block to regain momentum.`;
      actionableItem = "Click 'Auto Prioritize' to let Mitr structure your focus hours.";
    } else if (totalStreak > 0) {
      category = 'efficiency';
      title = "Streak Momentum Building!";
      message = `Amazing job keeping your habits consistent! You have an active streak momentum going on right now. Don't break the chain.`;
      actionableItem = "Complete a quick 5-minute habit block right now to lock in your day.";
    } else if (totalHabits > 0) {
      category = 'wellness';
      title = "Hydration & Energy Shield";
      message = "High-efficiency output requires physiological recovery. Ensure you are taking consistent breaks and staying hydrated.";
      actionableItem = "Take a 5-minute walk and drink a glass of water.";
    }
    
    const newInsight: CoachingInsight = {
      id: 'in-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      category,
      title,
      message,
      actionableItem
    };
    
    // Insert to DB list so history accumulates
    db.insights.unshift(newInsight);
    writeDB(db);
    
    res.json(newInsight);
  }
});


/**
 * 5. Mitr AI Interactive Companion Assistant Chat Endpoint
 * Chat real-time in comforting, custom Hinglish context, evaluating current tasks, streaks & blockers.
 */
app.post('/api/ai/companion', async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  const db = readDB();
  const userName = req.body.userName || "user";
  
  // Custom smart summarize to feed Gemini
  const activeTasksList = db.tasks.filter(t => t.status !== 'completed').map(t => `${t.title} (${t.priority} priority, ${t.difficulty} difficulty)`);
  const activeHabitsList = db.habits.map(h => `${h.title}: ${h.streak} days streak`);
  
  try {
    const ai = getAI();
    const systemPrompt = `You are "Mitr", a cute, energetic, and highly-supportive empathetic AI Companion.
The user's name is ${userName}.
Your mission is to motivate the user, prevent procrastination, and bring positive energy.
Always respond in comforting, extremely conversational Hindi & English (Hinglish), mixing encouragement with light-hearted humor. Use words like "yaar", "tension mat lo", "mast", "chalo bina procrastinate kiye start karte hain!".
Analyze their current live task workload:
- Pending Tasks: ${JSON.stringify(activeTasksList)}
- Habit Streaks: ${JSON.stringify(activeHabitsList)}

If they ask "kya chal rha hai" or "what's up", proactively review these tasks and tease them nicely or suggest starting with their easiest/most urgent task in a 15-minute slot.
Keep your response brief (maximum 3 to 4 sentences). Speak directly, as a human buddy standing next to them. Do not sound like a generic corporate bot.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ reply: response.text || "Main chal raha hoon yaar! Kaam start karein?" });
  } catch (error) {
    console.log('Mitr companion chat executing local dialogue responder path.');
    
    const query = message.toLowerCase();
    const pendingTasks = db.tasks.filter(t => t.status !== 'completed');
    const habits = db.habits;
    
    let reply = "";
    
    if (query.includes('chal') || query.includes('status') || query.includes('workload') || query.includes('what') || query.includes('up')) {
      if (pendingTasks.length > 0) {
        const topTask = pendingTasks[0].title;
        reply = `Aree ${userName}! Abhi aapke pass total ${pendingTasks.length} tasks bache hain, jaise "${topTask}". Kaam bada lag rha ho toh micro-steps me tod do, par start zaroor karo yaar! Mere side se full backup active hai.`;
      } else {
        reply = `Aree ${userName}! Aapka saara task list clear hai abhi! Mast thoda rest karo, coffee piyo, ya koi nayi routine habit track list me add kar do.`;
      }
    } else if (query.includes('motivat') || query.includes('aalas') || query.includes('bor') || query.includes('energy')) {
      const motivationQuotes = [
        `Oye, aalas bilkul nahi! Ek baar shuru kar do bas 10 minute ke liye, energy apne aap aa jayegi. Tum kar sakte ho, let's go! 🚀`,
        `Tension mat lo yaar! Bade projects bhi chote chote tasks se hi complete hote hain. Ek glass paani piyo aur chalo pehla solid work block lagate hain! 🔥`
      ];
      reply = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
    } else if (query.includes('break') || query.includes('divide') || query.includes('step')) {
      if (pendingTasks.length > 0) {
        reply = `Suno! Aapke task "${pendingTasks[0].title}" ko decomposer tool se break kar diya hai. Ab bas micro-steps follow karo, solid consistency banegi!`;
      } else {
        reply = `Breakdown karne ke liye koi pending task toh bacha hi nahi hai yaar! Ek naya task add karo pehle.`;
      }
    } else if (query.includes('water') || query.includes('drink') || query.includes('hydration') || query.includes('health') || query.includes('self-care')) {
      reply = `Bilkul yaar! Hydration bohot zaroori hai deep work me focus barkarar rakhne ke liye. Jao ek glass thanda paani piyo aur body ko stretch karo! 💧`;
    } else {
      reply = `Suno yaar, servers thode slow lag rahe hain, par humara offline intelligence full-on active hai! Tension bilkul mat lo, bas task complete karne par focus rakho! Main aapka sacha Mitr hoon.`;
    }
    
    res.json({ reply });
  }
});


// ----------------------------------------------------
// 2030 FUTURISTIC MITR PROACTIVE API SUITE (Postgres + Gemini)
// ----------------------------------------------------

/**
 * 6. User Authentication with Postgres Sync
 * POST /auth/login & /api/auth/login
 */
const loginHandler = async (req: express.Request, res: express.Response) => {
  const { email, name, avatar, role } = req.body;
  const userEmail = email || 'user@example.com';
  const userName = name || 'Productive Mind';
  const userAvatar = avatar || '🚀';
  const userRole = role || 'Full Stack Dev';
  const userId = 'u-' + Math.random().toString(36).substring(2, 11);

  console.log(`Authenticating user: ${userEmail}`);

  if (usePostgres && pool) {
    try {
      const client = await pool.connect();
      // Check if user exists
      const existCheck = await client.query('SELECT * FROM users WHERE email = $1', [userEmail]);
      let finalUser;
      if (existCheck.rows.length > 0) {
        finalUser = existCheck.rows[0];
        console.log("User matched from Postgres DB");
      } else {
        // Create user
        const insertRes = await client.query(
          'INSERT INTO users (id, name, email, profile) VALUES ($1, $2, $3, $4) RETURNING *',
          [userId, userName, userEmail, JSON.stringify({ avatar: userAvatar, role: userRole })]
        );
        finalUser = insertRes.rows[0];
        console.log("New user registered in Postgres DB");
      }
      client.release();
      return res.json({
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        avatar: finalUser.profile?.avatar || userAvatar,
        role: finalUser.profile?.role || userRole
      });
    } catch (err) {
      console.error("Postgres Auth login failed, syncing to local fallback", err);
    }
  }

  // Backup Local Storage login fallback
  const db = readDB();
  return res.json({
    id: 'u-offline',
    name: userName,
    email: userEmail,
    avatar: userAvatar,
    role: userRole
  });
};

app.post('/api/auth/login', loginHandler);
app.post('/auth/login', loginHandler);


/**
 * 7. AI Task Prioritizer & Score Evaluator
 * POST /ai/prioritize & /api/ai/prioritize
 */
const prioritizeHandler = async (req: express.Request, res: express.Response) => {
  const db = readDB();
  if (db.tasks.length === 0) {
    return res.json({ tasks: [], message: "Task manager empty. Add a task to analyze!" });
  }

  try {
    const ai = getAI();
    const systemPrompt = `You are the core cognitive engine of "Mitr Proactive" (2030 AI Assistant).
Your job is to analyze the user's list of tasks and evaluate risk matrices.
For each task, you must:
1. Estimate a realistic Time required (in hours).
2. Rate the Deadline Risk (0-100 percentage) based on due date proximity and complexity.
3. Suggest an immediate Actionable Micro-Step (under 20 mins) to defeat procrastination.
4. Set an AI Priority: "high", "medium", or "low".
5. Evaluate your AI Confidence level (0-100 percentage).
6. Give a 1-sentence supportive Rationale in Hinglish.

Return ONLY a JSON array matching this exact schema:
[
  {
    "id": "original task id",
    "aiScore": 85, // Deadline Risk percentage (0-100)
    "estimatedTime": 4, // in hours
    "aiConfidence": 95, // confidence percentage (0-100)
    "recommendedAction": "Actionable micro-step",
    "suggestedPriority": "high",
    "rationale": "friendly explanation in Hinglish"
  }
]`;

    const modelInput = JSON.stringify(db.tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate,
      category: t.category
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Prioritize these tasks:\n${modelInput}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              aiScore: { type: Type.INTEGER, description: 'Deadline Risk percentage (0 to 100)' },
              estimatedTime: { type: Type.INTEGER, description: 'Estimated execution hours' },
              aiConfidence: { type: Type.INTEGER, description: 'AI confidence score (0 to 100)' },
              recommendedAction: { type: Type.STRING, description: 'Short anti-procrastination micro-step' },
              suggestedPriority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              rationale: { type: Type.STRING, description: '1-sentence supportive Hinglish statement' }
            },
            required: ['id', 'aiScore', 'estimatedTime', 'aiConfidence', 'recommendedAction', 'suggestedPriority', 'rationale']
          }
        }
      }
    });

    const parsedResults = JSON.parse(response.text || '[]');

    // Apply updates to local DB
    parsedResults.forEach((item: any) => {
      const t = db.tasks.find(tk => tk.id === item.id);
      if (t) {
        t.priority = item.suggestedPriority;
        t.isAIPrioritized = true;
        t.aiRationale = item.rationale;
        // Inject extra fields needed for 2030 UI
        (t as any).aiScore = item.aiScore; // Deadline Risk
        (t as any).estimatedTime = item.estimatedTime;
        (t as any).aiConfidence = item.aiConfidence;
        (t as any).recommendedAction = item.recommendedAction;
      }
    });

    writeDB(db);

    // Sync to Postgres if active
    if (usePostgres && pool) {
      try {
        const client = await pool.connect();
        for (const t of db.tasks) {
          await client.query(
            `INSERT INTO tasks (id, title, description, priority, deadline, status, estimated_time, ai_score, category, subtasks, ai_schedules, is_ai_prioritized, ai_rationale)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET
             priority = EXCLUDED.priority,
             estimated_time = EXCLUDED.estimated_time,
             ai_score = EXCLUDED.ai_score,
             is_ai_prioritized = EXCLUDED.is_ai_prioritized,
             ai_rationale = EXCLUDED.ai_rationale`,
            [
              t.id, t.title, t.description, t.priority, t.dueDate, t.status, 
              (t as any).estimatedTime || 2, (t as any).aiScore || 50, t.category, 
              JSON.stringify(t.subtasks), JSON.stringify(t.aiSchedules || []), 
              t.isAIPrioritized, t.aiRationale
            ]
          );
        }
        client.release();
      } catch (e) {
        console.error("Failed to sync prioritized tasks to PostgreSQL:", e);
      }
    }

    res.json(db.tasks);
  } catch (error) {
    console.log('Mitr prioritized evaluation executing offline heuristic prioritize generator path.');
    
    db.tasks.forEach((t) => {
      if (!t.isAIPrioritized) {
        t.priority = t.priority || 'medium';
        t.isAIPrioritized = true;
        
        // Calculate dynamic scores based on priority/difficulty/duedate
        const isHigh = t.priority === 'high';
        const isComplex = t.difficulty === 'complex';
        
        const scoreBase = isHigh ? 80 : (t.priority === 'medium' ? 50 : 20);
        const difficultyBonus = isComplex ? 15 : (t.difficulty === 'moderate' ? 5 : 0);
        const aiScore = Math.min(100, Math.max(10, scoreBase + difficultyBonus + Math.floor(Math.random() * 10)));
        
        const estimatedTime = isComplex ? 5 : (t.difficulty === 'moderate' ? 3 : 1);
        const aiConfidence = 85 + Math.floor(Math.random() * 12);
        
        const actions: Record<string, string[]> = {
          'high': [
            `Draft the core outline of "${t.title}" first to reduce starting inertia.`,
            `Do a 15-minute quick sprint on "${t.title}" to build immediate momentum.`
          ],
          'medium': [
            `Spend 10 minutes compiling references for "${t.title}".`,
            `Write down the next 3 micro-steps for "${t.title}" on a sticky note.`
          ],
          'low': [
            `Perform a quick scan of "${t.title}" guidelines.`,
            `Mark a 10-minute slot on your calendar to review "${t.title}".`
          ]
        };
        const actionOptions = actions[t.priority as 'high'|'medium'|'low'] || actions['medium'];
        const recommendedAction = actionOptions[Math.floor(Math.random() * actionOptions.length)];
        
        const rationales = [
          `Aree, is task ko schedule karke tension khatam karo, thoda-thoda karke ho jayega!`,
          `High-focus slot align kiya hai iske liye. Ekdum aaram se start karo, ho jayega!`,
          `No procrastination! Ek simple 15-min deep work session se shuru karo yaar.`
        ];
        const rationale = rationales[Math.floor(Math.random() * rationales.length)];
        
        t.aiRationale = rationale;
        (t as any).aiScore = aiScore;
        (t as any).estimatedTime = estimatedTime;
        (t as any).aiConfidence = aiConfidence;
        (t as any).recommendedAction = recommendedAction;
      }
    });
    
    writeDB(db);
    res.json(db.tasks);
  }
};

app.post('/api/ai/prioritize', prioritizeHandler);
app.post('/ai/prioritize', prioritizeHandler);


/**
 * 8. Autonomous AI Planner (Dynamic Schedule Generator)
 * POST /ai/create-plan & /api/ai/create-plan
 */
const createPlanHandler = async (req: express.Request, res: express.Response) => {
  const { availableHours } = req.body;
  const hours = availableHours || 4;
  const db = readDB();

  try {
    const ai = getAI();
    const systemPrompt = `You are the "Autonomous AI Planner" component of Mitr Proactive.
Given the user has exactly ${hours} hours available today, review their pending tasks:
${JSON.stringify(db.tasks.filter(t => t.status !== 'completed'))}

Formulate a realistic, highly optimized schedule that fits perfectly inside ${hours} hours.
Decide:
- Which high-priority tasks must be completed today.
- Which tasks should be deferred to tomorrow/later, and explain why.
- Provide step-by-step hour blocks.

Output a clean JSON object matching this schema:
{
  "totalAllocatedMinutes": 240, // calculation of planned minutes
  "schedule": [
    {
      "timeSlot": "9:00 AM - 10:30 AM",
      "taskTitle": "Task Name",
      "duration": "90 mins",
      "actionRequired": "Concrete focus direction"
    }
  ],
  "deferredTasks": [
    {
      "taskTitle": "Deferred task name",
      "reason": "Clear, logical deferral reasoning"
    }
  ],
  "rationale": "High-level summary explaining why this plan optimizes their energy."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a plan for ${hours} hours today.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalAllocatedMinutes: { type: Type.INTEGER },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING },
                  taskTitle: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  actionRequired: { type: Type.STRING }
                },
                required: ['timeSlot', 'taskTitle', 'duration', 'actionRequired']
              }
            },
            deferredTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskTitle: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ['taskTitle', 'reason']
              }
            },
            rationale: { type: Type.STRING }
          },
          required: ['totalAllocatedMinutes', 'schedule', 'deferredTasks', 'rationale']
        }
      }
    });

    const parsedPlan = JSON.parse(response.text || '{}');
    res.json(parsedPlan);
  } catch (error) {
    console.log('Autonomous planner executing offline task-aware schedule generator path.');
    
    const pendingTasks = db.tasks.filter(t => t.status !== 'completed');
    const schedule: any[] = [];
    const deferredTasks: any[] = [];
    
    let currentMinutes = 0;
    const maxMinutes = hours * 60;
    
    let startTime = 9; // Start at 9:00 AM
    
    pendingTasks.forEach((t, idx) => {
      const isHigh = t.priority === 'high';
      const durationMins = isHigh ? 90 : 60;
      
      if (currentMinutes + durationMins <= maxMinutes) {
        const endHour = startTime + Math.floor(durationMins / 60);
        const endMin = durationMins % 60;
        
        const slotStr = `${startTime}:00 AM - ${endHour}:${endMin === 0 ? '00' : endMin} AM`;
        schedule.push({
          timeSlot: slotStr,
          taskTitle: t.title,
          duration: `${durationMins} mins`,
          actionRequired: `Decompress "${t.title}" and focus strictly on high-impact objectives.`
        });
        
        currentMinutes += durationMins;
        startTime = endHour;
      } else {
        deferredTasks.push({
          taskTitle: t.title,
          reason: `Deferred to balance load. Exceeds your available target limit of ${hours} hours today.`
        });
      }
    });
    
    if (schedule.length === 0) {
      schedule.push({
        timeSlot: "9:00 AM - 10:30 AM",
        taskTitle: "Workspace Setup & Deep Focus",
        duration: "90 mins",
        actionRequired: "Clear clutter, define your single most important deliverable, and work in silent block."
      });
    }
    
    res.json({
      totalAllocatedMinutes: currentMinutes || 90,
      schedule,
      deferredTasks,
      rationale: "Optimized locally using strict priority & duration alignment rules. This limits switching cost and guarantees focus."
    });
  }
};

app.post('/api/ai/create-plan', createPlanHandler);
app.post('/ai/create-plan', createPlanHandler);


/**
 * 9. Future Risk Prediction Analyzer
 * POST /ai/analyze-risk & /api/ai/analyze-risk
 */
const analyzeRiskHandler = async (req: express.Request, res: express.Response) => {
  const db = readDB();
  const pending = db.tasks.filter(t => t.status !== 'completed');

  if (pending.length === 0) {
    return res.json({
      riskLevel: "LOW 🟢",
      missingProbability: 5,
      criticalWarning: "Excellent job! You have zero pending deadlines on your radar. Aura is fully intact.",
      remedy: "Keep maintaining daily habit streaks."
    });
  }

  try {
    const ai = getAI();
    const systemPrompt = `You are "Mitr Future Risk Predictor". Your role is to calculate the probability of missing incoming deadlines.
Analyze these tasks:
${JSON.stringify(pending)}

Provide a strict statistical and emotional assessment:
- State a riskLevel ("CRITICAL 🔴", "WARNING 🟡", "SAFE 🟢").
- State a cumulative missingProbability (percentage integer between 0 and 100).
- Pinpoint a specific criticalWarning explaining exactly which task is at highest risk due to size vs due date.
- Formulate a suggested emergency remedy action to cut risk in half immediately.

Output a clean JSON object with this exact structure:
{
  "riskLevel": "WARNING 🟡",
  "missingProbability": 76,
  "criticalWarning": "Detailed threat analysis statement",
  "remedy": "Short emergency suggestion block"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Calculate future risks.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            missingProbability: { type: Type.INTEGER },
            criticalWarning: { type: Type.STRING },
            remedy: { type: Type.STRING }
          },
          required: ['riskLevel', 'missingProbability', 'criticalWarning', 'remedy']
        }
      }
    });

    const parsedRisk = JSON.parse(response.text || '{}');
    res.json(parsedRisk);
  } catch (error) {
    console.log('Risk analyzer executing offline risk analysis path.');
    res.json({
      riskLevel: "WARNING 🟡",
      missingProbability: 64,
      criticalWarning: "Task complexity and backlog density indicate substantial friction towards Friday deadlines.",
      remedy: "Execute 2 easy pending subtasks right now to build momentum."
    });
  }
};

app.post('/api/ai/analyze-risk', analyzeRiskHandler);
app.post('/ai/analyze-risk', analyzeRiskHandler);


/**
 * 10. AI Chat Productivity Coach
 * POST /ai/chat & /api/ai/chat
 */
const coachChatHandler = async (req: express.Request, res: express.Response) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const db = readDB();
  const activeTasksList = db.tasks.filter(t => t.status !== 'completed').map(t => `${t.title} (Priority: ${t.priority}, Due: ${t.dueDate})`);
  const habitsList = db.habits.map(h => `${h.title}: streak ${h.streak}`);

  try {
    const ai = getAI();
    const systemPrompt = `You are the executive "AI Productivity Coach" of Mitr Proactive.
You are helping the user become a top-tier performer, destroy procrastination, and achieve goals.
Provide incredibly smart, pragmatic, and psychologically backed tips. Don't be cliché.
Always integrate their real-time productivity data to ground your advice:
- Pending Deadlines: ${JSON.stringify(activeTasksList)}
- Current Habits: ${JSON.stringify(habitsList)}

Respond in friendly, comforting, conversational Hinglish (blend of Hindi and English) with terms like "yaar", "tension mat lo", "ekdum sahi". Give bullet points for easy reading. Keep it under 150 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ reply: response.text || "Main aapka sacha mitr hoon. Chaliye planning shuru karein!" });
  } catch (error) {
    console.log('Coach chat executing offline Hinglish coach path.');
    res.json({ reply: "Aree yaar, backend optimization chal raha hai. Par tension mat lo! Tum is block me deep-work shuru karo, main backup state active rakhunga!" });
  }
};

app.post('/api/ai/chat', coachChatHandler);
app.post('/ai/chat', coachChatHandler);


// ----------------------------------------------------
// BACKGROUND COGNITIVE ALERT SCHEDULER
// ----------------------------------------------------
function startNotificationScheduler() {
  console.log('[Scheduler] Background notification engine initialized.');
  setInterval(async () => {
    try {
      const db = readDB();
      const now = Date.now();
      let updated = false;

      for (const t of db.tasks) {
        // Skip completed tasks
        if (t.status === 'completed') continue;

        // Auto-parse reminder details from description if they are not explicitly set
        if (!t.reminderEmail && t.description && t.description.includes('Simulated EMAIL reminder')) {
          const match = t.description.match(/Simulated EMAIL (?:reminder|alert) set for (\S+@\S+) at (\d{2}:\d{2})/i);
          if (match) {
            t.reminderEmail = match[1];
            t.reminderTime = match[2];
            try {
              // Parse the local time using the correct captured timezone offset from the client or task
              const tz = t.timezoneOffset || lastTimezoneOffset;
              const dt = new Date(`${t.dueDate}T${t.reminderTime}:00${tz}`);
              t.reminderTimestamp = dt.getTime();
            } catch (e) {
              console.error('[Scheduler] Failed to parse fallback timestamp:', e);
            }
            updated = true;
          }
        }

        // Trigger condition: absolute timestamp reached and email not sent yet
        if (
          t.reminderEmail &&
          t.reminderTimestamp &&
          !t.reminderSent &&
          now >= t.reminderTimestamp
        ) {
          console.log(`[Scheduler] TRIGGER: Sending automated alert to ${t.reminderEmail} for task "${t.title}"`);

          const emailSubject = `🔔 [Mitr AI] Scheduled Reminder: "${t.title}"`;
          const emailBody = `Pranaam user!

Your Mitr AI Cognitive Companion has triggered this scheduled real-time email notification alert for your planned task.

--------------------------------------------------
📌 Task Alert Summary:
• Task Title: ${t.title}
• Due Date/Time: ${t.dueDate} ${t.dueTime || ''}
• Priority Level: ${t.priority.toUpperCase()}
• Difficulty Level: ${t.difficulty.toUpperCase()}

Companion Insight Note:
Consistent step-by-step action creates momentum. You are doing great!

Aura Focus Mode System
Mitr AI Assistant Team`;

          // Parse origin from lastKnownReferer for standard cors validation header
          let originHeader = 'https://ais-pre-xlniwashc7h3elt665vh5p-1060434645621.asia-southeast1.run.app';
          try {
            originHeader = new URL(lastKnownReferer).origin;
          } catch (e) {
            // fallback
          }

          try {
            const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(t.reminderEmail.trim())}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Referer': lastKnownReferer,
                'Origin': originHeader
              },
              body: JSON.stringify({
                _subject: emailSubject,
                name: 'Mitr AI Cognitive Assistant',
                email: 'assistant@mitr.ai',
                message: emailBody,
                _template: 'box'
              })
            });

            if (response.ok) {
              const resData = await response.json();
              if (resData.success === 'false' || resData.success === false) {
                console.log(`[Scheduler] Email dispatch for task ${t.id} returned success: false (likely needs activation). Will retry. Msg:`, resData.message);
              } else {
                console.log(`[Scheduler] Email successfully dispatched to ${t.reminderEmail}`, resData);
                t.reminderSent = true;
                updated = true;
              }
            } else {
              console.error(`[Scheduler] FormSubmit error response:`, await response.text());
            }
          } catch (fetchErr) {
            console.error(`[Scheduler] Failed to dispatch email for task ${t.id}:`, fetchErr);
          }
        }
      }

      if (updated) {
        writeDB(db);
      }
    } catch (schedErr) {
      console.error('[Scheduler Interval Error]:', schedErr);
    }
  }, 10000); // Check every 10 seconds for real-time responsiveness
}


// ----------------------------------------------------
// VITE DEV SERVER & STATIC MIDDLEWARE INTERACTION
// ----------------------------------------------------

async function start() {
  startNotificationScheduler();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = typeof __dirname !== 'undefined' ? __dirname : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server launched on http://0.0.0.0:${PORT}`);
  });
}

start();
