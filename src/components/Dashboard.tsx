import React, { useState, useEffect } from 'react';
import { Task, Habit, CoachingInsight, CalendarEvent } from '../types';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle, 
  Zap, 
  ArrowRight,
  RefreshCw,
  Award,
  Clock,
  Check,
  Flame,
  Hourglass,
  Gauge,
  Activity,
  Compass,
  Sparkle,
  Play,
  RotateCcw,
  Undo2,
  X,
  Pause,
  ChevronRight,
  FolderDot,
  MessageSquarePlus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';

interface DashboardProps {
  tasks: Task[];
  habits: Habit[];
  events: CalendarEvent[];
  insights: CoachingInsight[];
  onRefreshInsights: () => void;
  isLoadingInsights: boolean;
  onUpdateTaskStatus: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => void;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
}

export default function Dashboard({
  tasks,
  habits,
  events,
  insights,
  onRefreshInsights,
  isLoadingInsights,
  onUpdateTaskStatus,
  onAddTask,
  setActiveTab,
  isDarkMode
}: DashboardProps) {
  let loggedUserName = 'Productive Mind';
  try {
    const stored = localStorage.getItem('mitr_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      loggedUserName = parsed.name || loggedUserName;
    }
  } catch (e) {}

  // WhatsApp task parser states
  const [whatsappInput, setWhatsappInput] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState<string | null>(null);

  // Stopwatch states for In Progress tasks
  const [activeStopwatchTaskId, setActiveStopwatchTaskId] = useState<string | null>(null);
  const [stopwatchTimeMs, setStopwatchTimeMs] = useState<number>(0);
  const [stopwatchIsRunning, setStopwatchIsRunning] = useState<boolean>(false);
  const [showStopwatchModal, setShowStopwatchModal] = useState<boolean>(false);

  // Format milliseconds to MM:SS.CC or HH:MM:SS.CC
  const formatStopwatchTime = (timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((timeMs % 1000) / 10);

    const pad = (num: number) => String(num).padStart(2, '0');
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  // Run stopwatch interval
  useEffect(() => {
    let interval: any = null;
    if (stopwatchIsRunning && activeStopwatchTaskId) {
      interval = setInterval(() => {
        setStopwatchTimeMs(prev => prev + 100);
      }, 100);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatchIsRunning, activeStopwatchTaskId]);

  // Pause/Stop stopwatch if the task is no longer in progress
  useEffect(() => {
    if (activeStopwatchTaskId) {
      const activeTask = tasks.find(t => t.id === activeStopwatchTaskId);
      if (!activeTask || activeTask.status !== 'in_progress') {
        setStopwatchIsRunning(false);
      }
    }
  }, [tasks, activeStopwatchTaskId]);

  // Find the active task tracked by the stopwatch
  const stopwatchTask = activeStopwatchTaskId ? tasks.find(t => t.id === activeStopwatchTaskId) : null;

  const parseWhatsAppTask = (text: string) => {
    const title = text.trim();
    if (!title) return null;

    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (/high/i.test(text) || /urgent/i.test(text) || /crucial/i.test(text) || /zaroori/i.test(text)) {
      priority = 'high';
    } else if (/low/i.test(text) || /aaram/i.test(text)) {
      priority = 'low';
    }

    let difficulty: 'easy' | 'moderate' | 'complex' = 'moderate';
    if (/easy/i.test(text) || /aasan/i.test(text) || /simple/i.test(text)) {
      difficulty = 'easy';
    } else if (/complex/i.test(text) || /hard/i.test(text) || /difficult/i.test(text) || /bada/i.test(text)) {
      difficulty = 'complex';
    }

    let category = 'General';
    if (/work/i.test(text) || /office/i.test(text) || /job/i.test(text) || /kaam/i.test(text)) {
      category = 'Work';
    } else if (/study/i.test(text) || /college/i.test(text) || /school/i.test(text) || /exam/i.test(text) || /padhai/i.test(text)) {
      category = 'Education';
    } else if (/bill/i.test(text) || /pay/i.test(text) || /recharge/i.test(text) || /paisa/i.test(text)) {
      category = 'Bills';
    } else if (/gym/i.test(text) || /health/i.test(text) || /exercise/i.test(text) || /wellness/i.test(text) || /water/i.test(text) || /meditate/i.test(text)) {
      category = 'Wellness';
    }

    let dueDate = new Date().toISOString().split('T')[0];
    if (/tomorrow/i.test(text) || /kal/i.test(text)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
    } else if (/next week/i.test(text)) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      dueDate = nextWeek.toISOString().split('T')[0];
    } else {
      const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        dueDate = dateMatch[0];
      }
    }

    // Clean title of keywords to make it clean and neat
    let cleanTitle = title
      .replace(/(high|medium|low)\s+priority/i, '')
      .replace(/priority\s+(high|medium|low)/i, '')
      .replace(/tomorrow/i, '')
      .replace(/today/i, '')
      .replace(/kal/i, '')
      .replace(/next week/i, '')
      .replace(/wellness/i, '')
      .replace(/work/i, '')
      .replace(/education/i, '')
      .replace(/bills/i, '')
      .trim();

    if (!cleanTitle) cleanTitle = title;

    return {
      title: cleanTitle,
      description: `Created via WhatsApp Quick Chat. Input: "${text}"`,
      priority,
      status: 'pending' as const,
      difficulty,
      dueDate,
      category,
      dueTime: '12:00'
    };
  };

  // State for Autonomous Planner
  const [availableHours, setAvailableHours] = useState<number>(4);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [aiPlan, setAiPlan] = useState<{
    totalAllocatedMinutes: number;
    schedule: Array<{ timeSlot: string; taskTitle: string; duration: string; actionRequired: string }>;
    deferredTasks: Array<{ taskTitle: string; reason: string }>;
    rationale: string;
  } | null>(null);

  // State for Risk Analyzer
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState<boolean>(false);
  const [riskData, setRiskData] = useState<{
    riskLevel: string;
    missingProbability: number;
    criticalWarning: string;
    remedy: string;
  } | null>({
    riskLevel: "WARNING 🟡",
    missingProbability: 45,
    criticalWarning: "Backlog density indicates substantial friction towards upcoming final evaluation deadlines.",
    remedy: "Execute the 'Write outline of slides' 15-minute subtask today to build behavioral momentum."
  });

  // State for live workspace optimization
  const [isPrioritizingWorkspace, setIsPrioritizingWorkspace] = useState<boolean>(false);
  const [optimizationMessage, setOptimizationMessage] = useState<string>("");

  // Advice Quote Carousel State
  const [adviceIndex, setAdviceIndex] = useState<number>(0);
  const [clickCount, setClickCount] = useState<number>(0);

  const proactiveQuotes = [
    {
      quote: "Yaar, 100% perfection is a heavy trap. 1% starting is a game changer. Pick your smallest subtask and win!",
      character: "Mitr Direct Advice ☕"
    },
    {
      quote: "Phone screen ko silent krke drawer me rkhdo. The universe will stay intact, promise!",
      character: "Focus Shield 🧘‍♂️"
    },
    {
      quote: "Commit to working for just 300 seconds. If it hurts, you can stop. (But spoiler: 87% of people keep going!)",
      character: "Mitr Neuroscience Hack 🧠"
    },
    {
      quote: "Success relies on high momentum, not perfect conditions. Move one item to 'In Progress' right now to wake up your dopamine.",
      character: "Tension Buster 🚀"
    }
  ];

  // Automated Metrics calculation
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const todoTasks = tasks.filter(t => t.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const averageStreak = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) : 0;

  // Next up focus task
  const urgentTask = pendingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  // Colors based on current theme mode - Neural Aurora Theme System
  const cardBg = "bg-card border border-border-default shadow-xs";
  const textMuted = "text-muted-text";
  const textTitle = "text-main-text";
  const primaryButton = "bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/10 font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer";
  const labelBadge = "bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-500/20 font-semibold tracking-wide shadow-[0_1px_2px_rgba(99,102,241,0.03)]";

  const chartColors = ['#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981'];

  // Chart Data preparation
  const categoryCount: Record<string, number> = {};
  tasks.forEach(t => {
    categoryCount[t.category || "Focus"] = (categoryCount[t.category || "Focus"] || 0) + 1;
  });
  const categoryData = Object.keys(categoryCount).length > 0 
    ? Object.entries(categoryCount).map(([name, value]) => ({ name, value }))
    : [
        { name: "Education", value: 3 },
        { name: "Bills", value: 1 },
        { name: "Work", value: 2 },
        { name: "Wellness", value: 1 }
      ];

  const statusData = [
    { name: "To Do", count: todoTasks.length },
    { name: "In Progress", count: inProgressTasks.length },
    { name: "Completed", count: completedTasks.length }
  ];

  const handleOptimiseWorkspace = async () => {
    setIsPrioritizingWorkspace(true);
    setOptimizationMessage("Cognitive processor studying deadline risks...");
    try {
      const response = await fetch('/api/ai/prioritize', { method: 'POST' });
      if (response.ok) {
        setOptimizationMessage("Success! Workspace prioritized with Gemini confidence ratings!");
        setTimeout(() => {
          setOptimizationMessage("");
          window.location.reload();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setOptimizationMessage("Completed background prioritization sync.");
      setTimeout(() => setOptimizationMessage(""), 1000);
    } finally {
      setIsPrioritizingWorkspace(false);
    }
  };

  const handleFetchAutonomousPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch('/api/ai/create-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableHours })
      });
      if (response.ok) {
        const data = await response.json();
        setAiPlan(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleUpdateRiskMetric = async () => {
    setIsAnalyzingRisk(true);
    try {
      const response = await fetch('/api/ai/analyze-risk', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setRiskData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

  useEffect(() => {
    handleFetchAutonomousPlan();
    handleUpdateRiskMetric();
  }, [tasks.length]);

  return (
    <div className="space-y-8 text-main-text" id="mitr-dynamic-dashboard">
      
      {/* 1. PROFESSIONAL HERO BRIEFING */}
      <div className={`rounded-3xl p-6 md:p-8 relative overflow-hidden border ${cardBg} transition-all duration-300`} id="hero-coaching-banner">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none"></div>
 
        <div className="space-y-4 max-w-4xl relative z-10">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${labelBadge}`}>
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span>Mitr Intelligent Co-pilot</span>
          </div>
 
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight leading-tight text-main-text">
            Namaste {loggedUserName}! <span className="text-secondary-text font-normal">Aaj kya phodna hai? Here is your daily briefing:</span>
          </h2>
 
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              <Clock className="w-3.5 h-3.5" /> AGILITY SCORE & PRIORITIES
            </div>
            
            <p className="text-xs sm:text-sm leading-relaxed text-secondary-text">
              You currently have <strong className="font-bold text-main-text">{pendingTasks.length} active assignments</strong>. 
              Mitr recommends initiating work on the <span className="text-indigo-600 dark:text-indigo-300 font-bold">"{urgentTask ? urgentTask.title : 'Daily Habit Routine'}"</span> block immediately. 
              Your computed risk factor of missing tomorrow's deliverables sits at <strong className="text-rose-600 dark:text-rose-400 font-bold">{riskData ? riskData.missingProbability : 45}%</strong>. Let's tackle this systematically!
            </p>

            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                🎯 Best Starting Category: Education
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                ⚡ Est. Time Cost: ~{tasks.length * 1.5} Hours
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                🧬 Agility Vibe: Pro-Active
              </span>
            </div>
          </div>

          {/* Control Triggers */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={handleOptimiseWorkspace}
              disabled={isPrioritizingWorkspace}
              className={primaryButton}
            >
              {isPrioritizingWorkspace ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Aligning Tasks...
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  Prioritize Workspace
                </>
              )}
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className="px-4 py-2.5 bg-card border border-border-default hover:bg-card-elevated text-main-text text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              Voice Commands
            </button>
          </div>

          {optimizationMessage && (
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 animate-pulse bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20 w-max">
              ✨ {optimizationMessage}
            </p>
          )}
        </div>
      </div>

      {/* WHATSAPP INSTANT QUICK TASK CREATOR */}
      <div className={`rounded-3xl p-6 border ${cardBg} relative overflow-hidden transition-all duration-300`} id="whatsapp-quick-creator">
        {/* Ambient indigo background glow matching other cards */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-[0_1px_2px_rgba(99,102,241,0.03)] shrink-0">
            <MessageSquarePlus className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm md:text-base text-main-text flex items-center gap-2">
              Instant task creator
              <span className="text-[9px] font-mono tracking-widest bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase shadow-[0_1px_2px_rgba(99,102,241,0.03)]">PRO</span>
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">
              Type the task and hit enter! Mitr's smart NLP engine instantly parses title, category, priority level, and deadlines.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!whatsappInput.trim()) return;
          if (onAddTask) {
            const parsed = parseWhatsAppTask(whatsappInput);
            if (parsed) {
              onAddTask(parsed);
              setWhatsappInput("");
              setWhatsappStatus(`✨ Naya Task create ho gaya ${loggedUserName}! "${parsed.title}" [Priority: ${parsed.priority.toUpperCase()}, Category: ${parsed.category}, Due: ${parsed.dueDate}]`);
              setTimeout(() => setWhatsappStatus(null), 5000);
            }
          }
        }} className="space-y-3.5">
          <div className="flex gap-2 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 p-1.5 rounded-2xl focus-within:bg-white dark:focus-within:bg-slate-950 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200 shadow-sm">
            <input
              type="text"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              placeholder="e.g., Study Springboot dependencies tomorrow high priority wellness"
              className="flex-1 bg-transparent border-0 outline-none px-3.5 text-xs md:text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/60 py-2 font-medium"
            />
            <button
              type="submit"
              disabled={!whatsappInput.trim()}
              className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-all border border-indigo-700 dark:border-indigo-400/80 shadow-[0_2px_8px_rgba(99,102,241,0.25)] disabled:opacity-30 disabled:shadow-none cursor-pointer active:scale-95 shrink-0"
              title="Create Task"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider mr-1">Quick presets:</span>
            {[
              "Review Springboot dependency injection tomorrow high priority Education",
              "Submit Slides of project next week Work",
              "Water drink checklist Wellness priority low",
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setWhatsappInput(p)}
                className="text-[10px] font-semibold bg-indigo-50/40 hover:bg-indigo-50/80 dark:bg-indigo-500/5 dark:hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-100/30 dark:border-indigo-500/10 px-3.5 py-1.5 rounded-full transition active:scale-95 cursor-pointer shadow-[0_1px_2px_rgba(99,102,241,0.02)]"
              >
                {p.length > 55 ? `${p.slice(0, 52)}...` : p}
              </button>
            ))}
          </div>

          {whatsappStatus && (
            <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 animate-fade-in bg-indigo-50/80 dark:bg-indigo-500/10 px-3.5 py-2.5 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20 shadow-[0_1px_2px_rgba(99,102,241,0.03)] w-max max-w-full">
              {whatsappStatus}
            </p>
          )}
        </form>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="essential-stats-row">
        
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-text font-bold uppercase tracking-wider">Completion Matrix</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-main-text">{taskCompletionRate}%</p>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-2">
            <div 
               className="bg-emerald-500 h-1 rounded-full transition-all duration-500" 
               style={{ width: `${taskCompletionRate}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-muted-text block mt-1.5">{completedTasks.length} of {tasks.length} finished</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-text font-bold uppercase tracking-wider">Habit Streaks</span>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-main-text">{habits.length}</p>
          <span className="text-[10px] text-muted-text block mt-2">Average Streak Consistency</span>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block mt-0.5">{averageStreak} days active</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-text font-bold uppercase tracking-wider">Today's Deliveries</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-main-text">
            {tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0] && t.status !== 'completed').length}
          </p>
          <span className="text-[10px] text-muted-text block mt-2">Critical targets due today</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mt-0.5">{todoTasks.length + inProgressTasks.length} items active</span>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-text font-bold uppercase tracking-wider">Mindful Level</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {taskCompletionRate > 80 ? 'Jira Master 👑' : taskCompletionRate > 40 ? 'Pro Active ⚡' : 'Initiator 🌱'}
          </p>
          <span className="text-[10px] text-muted-text block mt-2">Behavior feedback status</span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">High Focus Rating</span>
        </div>

      </div>

      {/* 3. JIRA-INSPIRED KANBAN BOARD (Core Task Workflow) */}
      <div className={`rounded-3xl p-5 md:p-6 border ${cardBg}`} id="jira-kanban-board-workspace">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FolderDot className="w-5 h-5 text-indigo-500" />
              Task workflow
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Manage your tasks visually. Transition items between columns to reflect progress.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('tasks')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            Create New Task <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Board Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMN 1: TO DO */}
          <div className="flex flex-col h-full bg-card-elevated border border-border-default p-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-bold text-sm text-secondary-text">To Do</span>
                <span className="text-xs font-mono bg-card text-secondary-text border border-border-default px-2 py-0.5 rounded-full">
                  {todoTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[450px] pr-1">
              {todoTasks.length > 0 ? (
                todoTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`p-4 rounded-xl border bg-card border-border-default shadow-xs hover:border-primary transition duration-150`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-card-elevated text-secondary-text uppercase font-mono tracking-wider border border-border-default">
                        {task.category}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {task.priority === 'high' ? '🔴 High' : task.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                      </span>
                    </div>

                    <h4 className="font-bold text-[13px] leading-tight text-main-text">{task.title}</h4>
                    {task.description && (
                      <p className="text-[11px] text-muted-text mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-border-default flex items-center justify-between text-[10px] text-muted-text font-mono">
                      <span>📅 {task.dueDate}</span>
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}
                        className="px-2.5 py-1.5 bg-primary-glow hover:bg-primary-glow/85 text-primary rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Start working on task"
                      >
                        <Play className="w-3 h-3 fill-current" /> Start
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-text text-xs border border-dashed border-border-default rounded-xl bg-card/40">
                  No tasks To Do
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div className="flex flex-col h-full bg-card-elevated border border-border-default p-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="font-bold text-sm text-secondary-text">In Progress</span>
                <span className="text-xs font-mono bg-card text-secondary-text border border-border-default px-2 py-0.5 rounded-full">
                  {inProgressTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[450px] pr-1">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="p-4 rounded-xl border bg-card border-amber-500/20 shadow-xs hover:border-amber-400 transition duration-150 relative"
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 uppercase font-mono tracking-wider border border-amber-500/20">
                        {task.category}
                      </span>
                      <span className="text-[10px] font-bold text-amber-500">🟡 Active</span>
                    </div>

                    <h4 className="font-bold text-[13px] leading-tight text-main-text">{task.title}</h4>
                    {task.description && (
                      <p className="text-[11px] text-muted-text mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-border-default flex items-center justify-between gap-2 text-[10px] text-muted-text font-mono">
                      <span>📅 {task.dueDate}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (activeStopwatchTaskId !== task.id) {
                              setActiveStopwatchTaskId(task.id);
                              setStopwatchTimeMs(0);
                            }
                            setShowStopwatchModal(true);
                          }}
                          className={`px-2 py-1 flex items-center gap-1 cursor-pointer rounded-md border font-bold transition text-[10px] ${
                            activeStopwatchTaskId === task.id
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 hover:bg-amber-500/25'
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                          }`}
                          title="Open Task Stopwatch"
                        >
                          <Clock className={`w-3 h-3 ${activeStopwatchTaskId === task.id && stopwatchIsRunning ? 'animate-spin-slow' : ''}`} />
                          {activeStopwatchTaskId === task.id && stopwatchTimeMs > 0 ? formatStopwatchTime(stopwatchTimeMs) : 'Stopwatch'}
                        </button>
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'pending')}
                          className="px-2 py-1 bg-card border border-border-default hover:bg-card-elevated text-secondary-text rounded-md transition font-bold"
                          title="Move back to To Do"
                        >
                          <Undo2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, 'completed')}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Finish Task"
                        >
                          <Check className="w-3 h-3" /> Finish
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-text text-xs border border-dashed border-border-default rounded-xl bg-card/40">
                  Move task here to begin working
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: DONE */}
          <div className="flex flex-col h-full bg-card-elevated border border-border-default p-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-default">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-sm text-secondary-text">Done</span>
                <span className="text-xs font-mono bg-card text-secondary-text border border-border-default px-2 py-0.5 rounded-full">
                  {completedTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[450px] pr-1">
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="p-4 rounded-xl border bg-card/60 border-border-default opacity-75 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-card-elevated text-muted-text uppercase font-mono">
                        {task.category}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500">✅ Finished</span>
                    </div>

                    <h4 className="font-bold text-[13px] leading-tight line-through text-muted-text">{task.title}</h4>

                    <div className="mt-3 pt-2.5 border-t border-border-default flex items-center justify-between text-[10px] text-muted-text font-mono">
                      <span>🏁 Completed</span>
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'pending')}
                        className="px-2 py-1 bg-card border border-border-default hover:bg-card-elevated text-secondary-text rounded-md transition font-bold"
                        title="Reopen Task"
                      >
                        <RotateCcw className="w-3 h-3" /> Reopen
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-text text-xs border border-dashed border-border-default rounded-xl bg-card/40">
                  No completed tasks yet
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. DYNAMIC ROW: Autonomous Plan Simulator & Future Risk Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="intelligent-simulation-workspace">
        
        {/* WIDGET A: Autonomous Planner Board */}
        <div className={`rounded-3xl p-6 border ${cardBg}`} id="autonomous-planner">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-main-text text-sm md:text-base flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              Autonomous AI Planner
            </h3>
            <span className={`text-[10px] font-mono ${labelBadge} px-2 py-0.5 rounded-full uppercase tracking-wider font-bold`}>
              Gemini Optimization
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            <p className="text-secondary-text text-xs leading-relaxed font-medium">
              Mitr scans the difficulty of your tasks, priority levels, and drafts a chronological timeline, safely postponing low-impact items for your peace of mind.
            </p>

            <div className={`flex items-center gap-3.5 p-3 rounded-2xl border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-900/30' : 'bg-indigo-50/30 border-indigo-100/60'} shadow-sm`}>
              <span className="text-xs text-indigo-700 dark:text-indigo-300 font-mono font-extrabold shrink-0">Hours:</span>
              <input
                type="range"
                min="1"
                max="12"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold bg-indigo-600 dark:bg-indigo-500 text-white px-3.5 py-1.5 rounded-full border border-indigo-700 dark:border-indigo-400 min-w-[70px] text-center font-mono shadow-[0_2px_8px_rgba(99,102,241,0.25)]">
                {availableHours} Hrs
              </span>
            </div>

            <button
              onClick={handleFetchAutonomousPlan}
              disabled={isGeneratingPlan}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-sm shadow-primary/10"
            >
              {isGeneratingPlan ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Chrono-Schedule...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current text-amber-300" />
                  Compile Autonomous Schedule
                </>
              )}
            </button>
          </div>

          {/* Generated plan rendering */}
          {aiPlan ? (
            <div className={`mt-4 space-y-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'} text-xs`}>
              <div className="flex items-center justify-between text-muted-text pb-1.5 border-b border-slate-200 dark:border-slate-800">
                <span>Timeblocks Layout:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{aiPlan.totalAllocatedMinutes} Allocated Mins</span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {aiPlan.schedule.map((slot, index) => (
                  <div key={index} className="flex gap-2 items-start border-l-2 border-indigo-500 pl-3 py-0.5">
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-main-text text-[13px] font-bold">{slot.taskTitle}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">{slot.timeSlot} ({slot.duration})</span>
                      </div>
                      <p className="text-secondary-text text-[11px] leading-relaxed">{slot.actionRequired}</p>
                    </div>
                  </div>
                ))}
              </div>

              {aiPlan.deferredTasks && aiPlan.deferredTasks.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-rose-500 font-semibold block text-[10px] uppercase font-mono">⚠️ DEFERRED (Postponed):</span>
                  {aiPlan.deferredTasks.map((def, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10 text-[11px]">
                      <span className="text-rose-400 font-black shrink-0">•</span>
                      <p className="text-secondary-text">
                        <strong className="text-main-text">{def.taskTitle}</strong>: {def.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-muted-text italic mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 leading-relaxed">
                <strong className="text-secondary-text font-bold">Core Strategy:</strong> {aiPlan.rationale}
              </p>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-text text-xs mt-2">
              Autonomous Planner standby. Drag the focus slider and tap compile!
            </div>
          )}
        </div>

        {/* WIDGET B: Future Risk Predictor */}
        <div className={`rounded-3xl p-6 border ${cardBg}`} id="risk-predictor">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-main-text text-sm md:text-base flex items-center gap-2">
              <Gauge className="w-5 h-5 text-amber-500" />
              Future Risk Prediction
            </h3>
            <span className="text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">
              Predictive Threat Map
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
            
            {/* Risk Probability Gauge Circular Display */}
            <div className={`sm:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="relative w-24 h-24 flex items-center justify-center">
                
                {/* SVG circular progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="6" fill="transparent" />
                  <circle 
                     cx="48" 
                     cy="48" 
                     r="40" 
                     stroke={riskData && riskData.missingProbability > 50 ? "#ef4444" : "#f59e0b"} 
                     strokeWidth="6" 
                     fill="transparent" 
                     strokeDasharray={251.2}
                     strokeDashoffset={251.2 - (251.2 * (riskData ? riskData.missingProbability : 45)) / 100}
                     strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-main-text font-mono">{riskData ? riskData.missingProbability : 45}%</span>
                  <span className="text-[8px] text-muted-text uppercase tracking-widest block font-mono">Risk</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold mt-2.5 uppercase px-2 py-0.5 rounded-md ${
                riskData && riskData.riskLevel.includes('CRITICAL') ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {riskData ? riskData.riskLevel : "WARNING 🟡"}
              </span>
            </div>

            {/* Risk details */}
            <div className="sm:col-span-2 space-y-3">
              <p className="text-secondary-text text-xs leading-relaxed font-medium">
                Mitr monitors subtask progress, current streak histories, and upcoming deadlines to forecast schedule blockages.
              </p>

              <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} text-xs space-y-1.5`}>
                <span className="text-red-500 font-bold block text-[10px] uppercase font-mono">🔴 PREDICTIVE PATH WARNING:</span>
                <p className="text-secondary-text leading-relaxed text-[11px] font-medium">
                  {riskData ? riskData.criticalWarning : "Complexity and backlog density indicate substantial friction towards upcoming evaluation deadlines."}
                </p>
              </div>
            </div>

          </div>

          <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/15 space-y-2 text-xs">
            <div className="font-semibold text-amber-600 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              Emergency Mitigation Advice:
            </div>
            <p className="text-secondary-text leading-relaxed text-[11px] font-medium">
              {riskData ? riskData.remedy : "Execute 2 easy pending subtasks right now to build momentum."}
            </p>
            <button
              onClick={handleUpdateRiskMetric}
              disabled={isAnalyzingRisk}
              className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-all font-mono flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              {isAnalyzingRisk ? "Simulating scenario..." : "🔄 Re-evaluate Risk Factors"}
            </button>
          </div>

        </div>

      </div>

      {/* 5. ADVICE CAROUSEL: Procrastination Buster Wheel */}
      <div className={`border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-center ${cardBg}`} id="anti-procrastination-advisor-row">
        <div className="md:col-span-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold font-mono border ${labelBadge}`}>
              Mitr Anti-Procrastination Guide ☕
            </span>
            <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
            <p className="text-xs font-semibold text-muted-text flex items-center gap-1">
              <Sparkle className="w-3.5 h-3.5 text-indigo-500 animate-spin-pulse" /> Live companion suggestions
            </p>
          </div>
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1 transition-all`}>
            <p className="text-secondary-text text-sm italic font-bold leading-relaxed">
              "{proactiveQuotes[adviceIndex].quote}"
            </p>
            <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider font-mono">
              — {proactiveQuotes[adviceIndex].character}
            </p>
          </div>
        </div>

        <div className="space-y-2 flex flex-col justify-center items-stretch md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-5">
          <button
            onClick={() => {
              setAdviceIndex((prev) => (prev + 1) % proactiveQuotes.length);
              setClickCount(c => c + 1);
            }}
            className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-primary/10 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Change Advice
          </button>
          <div className={`text-[11px] text-muted-text font-mono text-center border py-1.5 rounded-lg ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            😄 Wellness Click Streak: <strong className="text-indigo-600 dark:text-indigo-400">{clickCount} clicks</strong>
          </div>
        </div>
      </div>

      {/* 6. CHARTS ROW: Interactive Mind-Space & Focus Analytics Panel */}
      <div className={`p-6 rounded-3xl space-y-6 border ${cardBg}`} id="interactive-analytics-section">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="font-extrabold text-main-text text-base md:text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Progress Analytics & Metrics
          </h3>
          <p className="text-xs text-muted-text mt-1">
            Visual graphs mapping category workloads and completion status ratios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart of Domain distribution */}
          <div className={`space-y-3 p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="font-semibold text-main-text text-center text-sm">
              Workload Category Distribution
            </h4>
            <div className="h-60 relative font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: isDarkMode ? '#0f172a' : '#ffffff', 
                      border: `1px solid ${isDarkMode ? '#1e293b' : '#cbd5e1'}`, 
                      borderRadius: '12px',
                      color: isDarkMode ? '#fff' : '#000'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute bottom-1 left-0 right-0 flex justify-center flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium max-h-16 overflow-y-auto px-2">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs animate-pulse" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span className="text-muted-text">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart of Task Statuses */}
          <div className={`space-y-3 p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="font-semibold text-main-text text-center text-sm">
              Workflow Status Quantities
            </h4>
            <div className="h-60 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ 
                      background: isDarkMode ? '#0f172a' : '#ffffff', 
                      border: `1px solid ${isDarkMode ? '#1e293b' : '#cbd5e1'}`, 
                      borderRadius: '12px',
                      color: isDarkMode ? '#fff' : '#000'
                    }}
                  />
                  <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, idx) => (
                      <Cell key={`bar-cell-${idx}`} fill={idx === 2 ? '#10b981' : idx === 1 ? '#fbbf24' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Mitr Focus Stopwatch Modal popup */}
      {showStopwatchModal && stopwatchTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl text-left scrollbar-thin">
            {/* Background glowing effects */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full filter blur-2xl -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full filter blur-2xl translate-y-1/2"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${stopwatchIsRunning ? 'bg-amber-500 animate-ping' : 'bg-slate-500'}`}></span>
                <h3 className="font-display font-bold text-base md:text-lg text-white">Mitr Focus Stopwatch</h3>
              </div>
              <button 
                onClick={() => setShowStopwatchModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Info Panel */}
            <div className="bg-slate-950/50 border border-slate-800/60 p-3.5 rounded-2xl mb-5 relative z-10">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 uppercase font-mono tracking-wider border border-indigo-500/30">
                {stopwatchTask.category}
              </span>
              <h4 className="font-bold text-sm md:text-base text-slate-100 mt-1.5 leading-snug">{stopwatchTask.title}</h4>
              {stopwatchTask.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{stopwatchTask.description}</p>
              )}
            </div>

            {/* Animated Stopwatch Clock Graphic */}
            <div className="flex flex-col items-center justify-center mb-5 relative z-10">
              <div className="relative w-36 h-36 md:w-40 md:h-40 flex items-center justify-center mb-4">
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 ${
                  stopwatchIsRunning ? 'border-amber-500/40 animate-[spin_30s_linear_infinite] scale-105' : 'border-slate-800'
                }`}></div>
                
                {/* Main Dial Outer */}
                <div className="absolute inset-1.5 rounded-full bg-slate-950 border border-slate-800/80 shadow-inner flex items-center justify-center">
                  
                  {/* Subtle dial markers */}
                  <div className="absolute top-1.5 text-[9px] text-slate-600 font-mono font-bold">12</div>
                  <div className="absolute right-3 text-[9px] text-slate-600 font-mono font-bold">15</div>
                  <div className="absolute bottom-1.5 text-[9px] text-slate-600 font-mono font-bold">30</div>
                  <div className="absolute left-3 text-[9px] text-slate-600 font-mono font-bold">45</div>

                  {/* Dynamic rotating needle hand */}
                  <div 
                    className="absolute w-0.5 bg-gradient-to-t from-transparent via-amber-500 to-amber-400 origin-bottom rounded-full transition-transform duration-100 ease-linear"
                    style={{ 
                      height: '42%',
                      bottom: '50%',
                      transform: `rotate(${((stopwatchTimeMs / 1000) * 6) % 360}deg)` 
                    }}
                  />
                  
                  {/* Center pin */}
                  <div className="absolute w-2.5 h-2.5 bg-amber-500 rounded-full shadow-md z-10 border border-slate-900"></div>
                </div>
              </div>

              {/* Digital Timer Readout */}
              <div className="text-center">
                <span className="font-mono text-3xl md:text-4xl font-extrabold tracking-tight text-white select-all">
                  {formatStopwatchTime(stopwatchTimeMs)}
                </span>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">
                  {stopwatchIsRunning ? 'Active Focus Session' : 'Session Paused'}
                </p>
              </div>
            </div>

            {/* Buttons Group */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button
                onClick={() => setStopwatchIsRunning(!stopwatchIsRunning)}
                className={`w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer transition text-xs md:text-sm ${
                  stopwatchIsRunning 
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                }`}
              >
                {stopwatchIsRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Start
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStopwatchIsRunning(false);
                  setStopwatchTimeMs(0);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 font-bold flex items-center justify-center gap-2 cursor-pointer transition text-xs md:text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Finish action */}
            <div className="mt-4 relative z-10 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => {
                  setStopwatchIsRunning(false);
                  onUpdateTaskStatus(stopwatchTask.id, 'completed');
                  setShowStopwatchModal(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition text-xs md:text-sm shadow-md"
              >
                <Check className="w-4 h-4" />
                Done & Finish Task
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-2.5 font-medium">
                Focus on your work. This stopwatch will keep tracking in the background.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
