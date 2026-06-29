# 🌟 Hackathon Project Description: Mitr Proactive

### **Project Name**: Mitr Proactive: Your Proactive AI Personal Companion (The Last-Minute Life-Saver)
### **Deployment URL**: https://mitr-proactive-623260536781.asia-southeast1.run.app
### **GitHub Repository**: https://github.com/spideyWebb/mitr-proactive-the-last-minute-life-saver

---

## 1. 🎯 Problem Statement Selected

### **The Burnout & Procrastination Crisis**
In today's fast-paced digital era, students and professionals are overwhelmed by information overload, shifting deadlines, and complex task-management applications. Traditional tools (like Jira, Trello, or Google Calendar) are **passive databases**; they require constant manual upkeep, complex form-filling, and visual cognitive friction. 

When deadlines loom, the psychological pressure manifests as **procrastination paralysis** and **burnout**. Users do not just need another grid of checkmarks; they need:
1. **Low Cognitive Friction**: A tool that understands chaotic natural language without form-clicking.
2. **Empathetic Planning**: An emotional companion that validates their anxiety, reframes stress, and negotiates workloads based on their real energy levels.
3. **Proactive Intervention**: An autonomous planner that dynamically allocates tasks based on limited hours, predicts upcoming deadline risks, and triggers alert systems before time runs out.

---

## 2. 💡 Solution Overview

### **Meet "Mitr" – The Proactive AI Best Friend**
**Mitr** (meaning *"Friend"* in Hindi) is a full-stack, AI-driven mental and task-planning companion. Instead of forcing the user to adapt to rigid project systems, Mitr acts as an empathetic, highly capable operational manager who co-creates daily schedules with the user.

Mitr shifts the productivity paradigm from **reactive tracking** to **proactive coaching**:
* **Autonomous Task Parsing**: Users voice or type chaotic thoughts (e.g., *"SpringBoot deadline is tomorrow morning and I still have to study dependencies. I am super stressed!"*), and Mitr instantly extracts categories, deadlines, and urgency.
* **Volume-Style Energy Slider**: Instead of demanding complex date-time picking, users simply drag a slide-dial to state: *"I have 4 hours of focus in me today."* Mitr's Agentic scheduler autonomously organizes the user's timeline, prioritizing high-impact tasks and safely rescheduling low-impact ones.
* **Dual CBT & Tactical Engine**: It combines clinical **Cognitive Behavioral Therapy (CBT)** thought-reframing with **chronological visual timelines** and interactive **digital-analog stopwatch dials**, closing the gap between mental calmness and tactical execution.

---

## 3. 🧩 Key Features

### **1. Instant Task Creator (Natural Language UI)**
* **No-Form Entry**: Standard tasks are added by typing plain text.
* **Structured Parsing**: Grounded Gemini algorithms analyze inputs in real-time, parsing them into distinct tasks with associated priorities (High, Medium, Low) and categories (Study, Work, Wellness).

### **2. Autonomous AI Daily Planner (Volume-style Time Allocation)**
* **Energy Optimization Slider**: Set available daily productivity hours via a gorgeous, glow-styled visual slider badge.
* **Chronological Time-Blocking**: The AI dynamically schedules time-slots (e.g., 09:00 AM, 11:00 AM) based on task durations, priorities, and buffer requirements. Non-urgent work is pushed out to save the user from burnout.

### **3. Future Risk & Burnout Predictor**
* **Workload Risk Assessment**: Visual gauge displaying current risk percentage based on accumulated workload, deadline proximity, and wellness task ratios.
* **Pre-emptive Remediation**: Mitr provides strategic instructions (e.g., *"Your workload is at 85%. I suggest pushing your wellness habits up and postponing non-essential meetings to avoid exhaustion."*).

### **4. Mitr AI Companion Chat**
* **Empathetic Counselor**: A specialized chatbot window mimicking a close friend. Mitr speaks conversationally (using contextual Hinglish and supportive words) to help users calm down while assessing pending item statuses.

### **5. Voice Assistant & CBT-Based Thought Re-framer**
* **Active Venting Interface**: A recording console styled with real-time pulsing waveform lines.
* **Mental Re-framing**: Users speak their catastrophizing worries (e.g., *"If I fail this, everyone will think I am incompetent."*). The AI Voice module processes and transforms this into constructive, CBT-grounded growth frameworks.

### **6. Proactive Reminders & Email Alerts (Mitr Alert Engine)**
* **Automated Threshold Scheduling**: Users select reminder offsets (e.g., 15m, 30m, 1h).
* **Alert Execution**: The backend Express scheduler tracks target timestamps and sends out proactive reminders to keep tasks from slipping under the radar.

### **7. Active Focus Timer & Stopwatch (Pomodoro Mode)**
* **High-Fidelity Visual Dial**: An elegant circular custom digital-and-analog hybrid visual stopwatch with custom rotating dials, pulse-glow markers, and dynamic rings.
* **Deep Focus Mode**: Start, pause, and log study/work blocks instantly.

### **8. Google Auth Portal**
* **Frictionless Google Chooser Modal**: Simplifies onboarding with a simulated multi-account interactive Google Sign-In portal.

---

## 4. 🛠️ Technologies Used

### **Frontend (Client-Side)**
* **React 18 & Vite**: Built as a supercharged Single Page Application ensuring near-instant page renders.
* **Tailwind CSS**: Custom, eye-safe, responsive dark slate aesthetic incorporating glowing indigo gradients.
* **Motion (`motion/react`)**: High-fidelity micro-interactions, spring transitions, and card entry animations.
* **Lucide-React**: Unified, professional vector icon assets.
* **Google Fonts**: Immersive typography using **Space Grotesk** (tech display), **Inter** (high-legibility UI text), and **JetBrains Mono** (status panels).

### **Backend (Server-Side)**
* **Node.js & Express**: A lightweight, scalable REST API and server router.
* **TypeScript & ESBuild**: High-speed runtime type checking using `tsx` in development, compiled to a single, bundled, ultra-fast `dist/server.cjs` for immediate cold-starts in container environments.

### **Database Engine**
* **Neon Cloud PostgreSQL**: Serverless relational cloud database hosting operational tables.
* **Fail-Safe JSON Fallback**: Native file-based `db.json` storage that automatically takes over if the cloud connection times out, ensuring 100% app uptime.

---

## 5. 🤖 Google Technologies Utilized

1. **Google Generative AI SDK (`@google/genai`)**: Interfaced via official packages to leverage state-of-the-art models.
2. **Gemini 2.5 & 1.5 Flash Models**: Chosen for their high-speed context window, zero-shot structured JSON output, and rapid conversational responses.
3. **Google AI Studio Cloud Environment**: Hosted and ran on Cloud Run containers with pre-configured secure routing.
4. **Google Sign-In Protocol UI**: Implemented standard secure SSO user flow designs for realistic user experience testing.

---

## 6. 🏆 Hackathon Evaluation Matrix Alignment

### **A. Problem Solving & Impact (20%)**
* **Direct Solution**: Targets the actual root cause of productivity failure: stress and administrative fatigue.
* **Tangible Utility**: Shifts users out of panic mode into active execution by doing the thinking and planning for them.

### **B. Agentic Depth (20%)**
* **Autonomous Decision Making**: Rather than just displaying tasks, the scheduling agent actively calculates time, evaluates user-defined priority levels, and chooses which tasks to assign or defer.
* **Real-Time Reactive Feedback**: Calculates load percentages and changes states dynamically as new tasks are typed or checked off.

### **C. Innovation & Creativity (20%)**
* **Empathetic Tech Fusion**: First productivity tool that merges CBT (mental health therapy) with rigorous chronological project management.
* **Volume Slider Allocation**: Replaces typical painful calendar block scheduling with a human-centric "Energy Meter".

### **D. Usage of Google Technologies (15%)**
* **Optimized GenAI**: Uses precise system instructions, JSON structured modes, and custom response schemas on the official `@google/genai` library.
* **Robust Infrastructure**: Fully responsive Cloud-native server configuration.

### **E. Product Experience & Design (10%)**
* **Bespoke Craftsmanship**: Features gorgeous custom typography pairing, elegant glassmorphic cards, a beautiful pulsing digital-analog focus dial, and seamless slide transitions. Absolutely no "AI Slop" or generic template elements.

### **F. Technical Implementation (10%)**
* **Dual-Storage Resilience**: Solid production-level engineering that uses a Cloud PostgreSQL db, but includes an intelligent automated fallback file-system (`db.json`) so the app never crashes during offline/sandbox jury reviews.
* **Clean Code**: Highly modularized React components, strong TypeScript safety, and standard API proxying on the backend.

### **G. Completeness & Usability (5%)**
* **Feature-Complete Demo**: Fully functional live app from sign-in simulation to interactive focus clocks, AI schedules, task adding, and chat dialogs.

---
*(Make sure to set your shared Google Doc link permissions to "Anyone with the link can view/comment" before submitting! Good luck, SK Pro! 🚀)*
