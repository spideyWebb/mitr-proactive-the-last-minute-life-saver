# 🌟 Mitr Proactive: Your Proactive AI Personal Companion

> **"Save your future before deadlines arrive."**  
> Mitr Proactive is a full-stack, AI-powered productivity companion designed to help busy individuals, students, and professionals defeat burnout, manage stress, and optimize daily timelines proactively. 

---

## 🔗 Project Navigation
* **Live Deployed Application**: [Mitr Proactive Live](${window.location.origin}) *(https://ais-pre-xlniwashc7h3elt665vh5p-1060434645621.asia-southeast1.run.app)*
* **Github Repository**: [mitr-proactive-the-last-minute-life-saver](https://github.com/spideyWebb/mitr-proactive-the-last-minute-life-saver)
* **Project Documentation (Google Doc)**: `[Insert Your Shared Google Doc Link Here]`

---

## 📺 Application Screenshots

| 🏠 Home (Daily Timeline & Overview) | 💬 Mitr Companion Chat UI |
| --- | --- |
| `<img src="./assets/dashboard_screenshot.png" alt="Dashboard" width="400"/>` | `<img src="./assets/mitr_chat_screenshot.png" alt="Mitr Chat" width="400"/>` |

| 🎯 Autonomous AI Scheduler | 🎙️ Voice Assistant & Mental Re-framing |
| --- | --- |
| `<img src="./assets/scheduler_screenshot.png" alt="Autonomous Planner" width="400"/>` | `<img src="./assets/voice_assistant_screenshot.png" alt="Voice Assistant" width="400"/>` |

*(Note: Please replace the image paths above with your actual repository screenshots, or upload images directly to your GitHub repo asset folder!)*

---

## 🧩 Key Features

### 1. 💬 Instant Task Creator
* **Natural Language Scheduling**: No complex form clicks. Simply type tasks in plain, natural language (e.g., `"Study Springboot dependencies tomorrow high priority wellness"`) directly in a polished chat bar.
* **Smart Parsing**: The background AI parses the text, extracts the intent, category (wellness, study, work), deadline, and sets the priority instantly.

### 2. ⏳ Autonomous AI Daily Planner (Volume-style Time Allocation)
* **Visual Slider Allocation**: A sleek, custom slider styled with premium indigo badges and glow effects allows users to set their daily available hours (e.g., `4 Hrs`).
* **Timeline Optimization**: Mitr scans all pending tasks, calculates difficulty and priorities, and drafts a chronological hour-by-hour visual schedule. Low-impact tasks are safely postponed to future dates for complete peace of mind.

### 3. 🛡️ Future Risk & Burnout Predictor
* **Proactive Forecaster**: Scans your overall workload, deadlines, and habits to forecast potential psychological and physical hurdles, health risks, or burnout peaks.
* **Pre-emptive Solutions**: Provides customized recommendations on where to delegate or simplify tasks before stress accumulates.

### 4. 🧠 Mitr AI Companion Chat
* **Empathetic Friend**: A conversational interface that acts as your counselor. Mitr reads your current stress level, task counts, and schedules to offer personalized, compassionate guidance.

### 5. 🎙️ Voice Assistant & Thought Re-framer
* **Cognitive Behavioral Therapy (CBT) Companion**: Speak directly into your microphone to vent. The AI Voice Assistant synthesizes the thoughts and reframes negative self-talk into constructive, uplifting perspectives.

### 6. 🔔 Proactive Reminders & Email Alerts (Mitr Alert Engine)
* **Automated Email Notifications**: Set specific reminder time offsets (e.g., 15 mins, 30 mins, 1 hour, or custom duration) before any task's due deadline.
* **Proactive Delivery**: The built-in backend scheduler tracks active reminder timestamps and securely delivers high-priority simulated/real email notifications to the logged-in user's email address when the threshold is hit.

### 7. ⏱️ Active Focus Timer & Stopwatch (Pomodoro Mode)
* **High-Fidelity Visual Dial**: Includes an elegant digital-and-analog hybrid stopwatch dial styled with premium rotating needle hands, custom markers, and dynamic pulse-glow rings.
* **Focus Tracker**: Start, pause, and reset your active study/work sessions directly from the home dashboard to maximize flow state and track focused time block by block.

### 8. 🔄 Hybrid Simulated Auth Portal with Google Sign-In
* **One-Click Google Sign-In**: Offers a seamless Google Accounts Chooser modal that simulates OAuth login flow—perfect for high-fidelity interactive presentations and smooth testing.

---

## 🛠️ Full-Stack Architecture & Technologies Used

```
                                  +-----------------------+
                                  |   React + Vite SPA    | (Frontend)
                                  | (Inter, Space Grotesk)|
                                  +-----------+-----------+
                                              |
                                     JSON API | (Express Routing)
                                              v
                                  +-----------+-----------+
                                  |    Express Server     | (Backend Engine)
                                  |   (tsx / ESBuild)     |
                                  +-----+-----------+-----+
                                        |           |
               @google/genai SDK (JSON) |           | Database Dual-Engine
                                        v           v
                        +---------------+--+     +--+------------------------+
                        |  Gemini 2.5/1.5  |     |  Neon Cloud PostgreSQL    |
                        |   Flash Models   |     | (Fallback: local db.json) |
                        +------------------+     +---------------------------+
```

### 1. Frontend (Client-Side)
* **Framework**: React 18+ bootstrapped with Vite for supercharged performance.
* **Styling**: Tailwind CSS utilizing responsive prefixes for absolute cross-device precision.
* **Animations**: Fluid, beautiful micro-interactions powered by `motion` (`motion/react`).
* **Icons**: Crisp, consistent vector icons from `lucide-react`.
* **Typography**: Elegant display headings using **Space Grotesk** paired with highly-legible **Inter** and technical **JetBrains Mono** monospace data views.

### 2. Backend (Server-Side)
* **Runtime**: Node.js utilizing an Express router framework.
* **Compilation**: Engineered with a dual-pipeline using `tsx` for high-speed local dev environments and `esbuild` to compile a unified, standalone `dist/server.cjs` for ultra-fast production cold-starts.

### 3. Google & AI Technologies Utilized
* **Google Generative AI SDK (`@google/genai`)**: Interfaced via the modern model endpoints (`gemini-2.5-flash` and `gemini-1.5-flash`) handling structured JSON outputs, streaming, and conversation history.
* **AI Subtask Generator**: Generates subtasks for task planning on the fly.
* **Speech Synthesis / Speech-to-Text**: Voice Assistant API with cognitive emotional reframing.

### 4. Database Dual-Engine (Robust & Dynamic)
* **Cloud Database**: Fully integrated with **Neon PostgreSQL (Serverless Cloud PG)** using standard connection pools with connection timeout tolerance.
* **Robust File Fallback**: Implements a native, fail-safe local JSON storage module (`db.json`) that kicks in seamlessly if the cloud database experiences connection timeouts, ensuring the app remains 100% active and responsive in any evaluation sandbox.

---

## 📂 Project Directory Structure

```
├── server.ts                 # Full-stack Express Backend & Server Entrypoint
├── package.json              # Main dependencies & ESBuild build scripts
├── metadata.json             # AI Studio App configuration and permissions
├── vite.config.ts            # Client bundling and server proxy settings
├── data/
│   └── db.json               # Local fallback relational database cache
├── src/
│   ├── main.tsx              # App Entrypoint
│   ├── App.tsx               # Main React Application Router & State Engine
│   ├── index.css             # Tailwind styling and custom Font imports
│   ├── types.ts              # System-wide Shared TypeScript Interfaces
│   └── components/
│       ├── Dashboard.tsx     # Key Views (Timeline, Slider, Tasks Input)
│       ├── LoginPortal.tsx   # Simulated Auth & Google Account Chooser Modal
│       ├── MitrCompanion.tsx # AI Chat & Mental Companion Component
│       ├── TaskPlanner.tsx   # Interactive Subtasks breakdown
│       ├── HabitTracker.tsx  # Habits logging & Cognitive Re-framing
│       └── VoiceAssistant.tsx# Audio CBT Voice Reframing interface
```

---

## ⚙️ Setup and Installation

Follow these quick steps to set up and run Mitr Proactive locally on your machine:

### Prerequisite
* Ensure you have **Node.js** (v18 or higher) installed on your system.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd mitr-proactive
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Server secret for Google GenAI Integration
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Run Development Server
Boot both the Express server and Vite builder simultaneously:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Build for Production
To bundle the frontend assets and compile the server code via ESBuild:
```bash
npm run build
npm start
```

---

## 🎖️ Credits & Acknowledgements
* Built under the **Google AI Studio** framework.
* Generative model architecture powered by the Google Gemini API.
* Hosted on Cloud Run with sandboxed ingress routing.
* UI inspiration from modern minimalist design systems with soft, warm indigo visual languages.
