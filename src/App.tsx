import React, { useState, useEffect } from 'react';
import { Task, Habit, CalendarEvent, CoachingInsight } from './types';
import Dashboard from './components/Dashboard';
import TaskPlanner from './components/TaskPlanner';
import InteractiveCalendar from './components/InteractiveCalendar';
import HabitTracker from './components/HabitTracker';
import VoiceAssistant from './components/VoiceAssistant';
import LoginPortal from './components/LoginPortal';
import MitrCompanion from './components/MitrCompanion';

import { 
  Sparkles, 
  ListTodo, 
  TrendingUp, 
  Calendar, 
  Clock, 
  LayoutDashboard, 
  Activity, 
  ArrowRight,
  User,
  Heart,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'habits' | 'calendar' | 'voice'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mitr_dark_mode') !== 'false';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('mitr_dark_mode', String(newVal));
      return newVal;
    });
  };

  const appTheme = isDarkMode ? 'nordic' : 'normal';

  // Authentication session state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; avatar: string; role: string } | null>(() => {
    const stored = localStorage.getItem('mitr_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (_) {}
    }
    return { email: 'user@example.com', name: 'Productive Mind', avatar: '🚀', role: 'Full Stack Dev' };
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mitr_logged_in') !== 'false';
  });

  const handleLogin = (user: { email: string; name: string; avatar: string; role: string }) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('mitr_user', JSON.stringify(user));
    localStorage.setItem('mitr_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.setItem('mitr_logged_in', 'false');
    localStorage.removeItem('mitr_user');
  };

  const themeAccentClass = isDarkMode ? 'text-indigo-400' : 'text-indigo-600';

  const themeGradientClass = isDarkMode ? 'from-slate-800 to-slate-900 border-slate-700' : 'from-indigo-600 to-indigo-700';

  const themeShadowClass = isDarkMode ? 'shadow-slate-950/20' : 'shadow-indigo-600/10';
  
  // App primary state logs
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [insights, setInsights] = useState<CoachingInsight[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Sync / Fetch function
  const fetchData = async () => {
    try {
      const [tasksRes, habitsRes, eventsRes, insightsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/habits'),
        fetch('/api/events'),
        fetch('/api/insights')
      ]);

      const [tasksVal, habitsVal, eventsVal, insightsVal] = await Promise.all([
        tasksRes.json(),
        habitsRes.json(),
        eventsRes.json(),
        insightsRes.json()
      ]);

      setTasks(tasksVal);
      setHabits(habitsVal);
      setEvents(eventsVal);
      setInsights(insightsVal);
    } catch (e) {
      console.error("API error syncing data state:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Task Mutate Actions
  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskData)
      });
      const created = await response.json();
      setTasks(prev => [created, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (id: string, updatedFields: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const updated = await response.json();
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Habit Mutate Actions
  const handleAddHabit = async (title: string, frequency: 'daily' | 'weekly') => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, frequency })
      });
      const created = await response.json();
      setHabits(prev => [...prev, created]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateHabit = async (id: string, updatedFields: Partial<Habit>) => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const updated = await response.json();
      setHabits(prev => prev.map(h => h.id === id ? updated : h));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar Event Mutate
  const handleAddEvent = async (newEventData: Omit<CalendarEvent, 'id'>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventData)
      });
      const created = await response.json();
      setEvents(prev => [...prev, created]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // AI Optimize trigger
  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/ai/optimize-schedule', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success && data.optimizedState) {
        setTasks(data.optimizedState);
        // Refresh insights to pull the auto-schedule log
        const insRes = await fetch('/api/insights');
        const insVal = await insRes.json();
        setInsights(insVal);
      }
    } catch (e) {
      console.error("Optimize failed:", e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // AI Coaching Insight request generator
  const handleRefreshCoachingInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/coaching-insights');
      const newInsight = await response.json();
      setInsights(prev => [newInsight, ...prev]);
    } catch (err) {
      console.error("Insight analyze error:", err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4" id="applet-loading">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
        <div className="text-center space-y-1">
          <h1 className="font-bold text-slate-800 text-lg">Mitr Proactive - Loading Cognitive companion</h1>
          <p className="text-xs text-slate-500 font-medium">Please wait while your active productivity dashboard is compiling...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginPortal 
        onLogin={handleLogin} 
        appTheme={appTheme} 
        themeGradientClass={themeGradientClass}
        themeShadowClass={themeShadowClass}
      />
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden font-sans flex flex-col md:flex-row transition-all duration-300 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`} id="applet-viewport">
      
      {/* Desktop Sidebar navigation - Hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex w-full md:w-66 bg-slate-950 h-full border-r border-slate-900 text-slate-300 flex-col justify-between shrink-0 shadow-lg animate-fade-in" id="sidebar-container">
        
        <div>
          {/* Logo brand */}
          <div className="p-6 border-b border-slate-900/60 flex items-center gap-3">
            <div className={`p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md transition-all duration-300`}>
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-white font-display font-bold leading-none tracking-tight text-base">Mitr Proactive</h1>
              <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase font-extrabold block mt-0.5">Prioritize Smarter. Achieve More.</span>
            </div>
          </div>

          {/* Navigation link stacks */}
          <nav className="p-4 space-y-2" id="sidebar-navigation">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'dashboard' 
                  ? `bg-indigo-600 text-white shadow-lg font-semibold` 
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Home
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'tasks' 
                  ? `bg-indigo-600 text-white shadow-lg font-semibold` 
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
              }`}
            >
              <ListTodo className="w-4 h-4" /> Cognitive Planner
            </button>

            <button
              onClick={() => setActiveTab('habits')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'habits' 
                  ? `bg-indigo-600 text-white shadow-lg font-semibold` 
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Auto-streak Habits
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'calendar' 
                  ? `bg-indigo-600 text-white shadow-lg font-semibold` 
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" /> Deadline Calendar
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'voice' 
                  ? `bg-indigo-600 text-white shadow-lg font-bold animate-pulse` 
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100 bg-emerald-500/5 border border-emerald-500/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400 fill-current animate-spin-pulse" /> Ask Mitr Voice (AI)
            </button>
          </nav>
        </div>

        {/* User identification credentials status pane */}
        <div className="p-4 border-t border-slate-900 space-y-3 bg-slate-950/40" id="user-credentials-panel">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 flex items-center justify-center font-bold text-base transition-transform hover:scale-110">
              {currentUser?.avatar || '🧠'}
            </div>
            <div className="text-xs truncate max-w-[155px]">
              <span className="text-slate-100 font-bold block truncate">{currentUser?.name || 'User'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5">
            <div className="text-[10px] text-indigo-400 font-mono font-medium truncate max-w-[110px]">
              👤 {currentUser?.role || 'Focus Dev'}
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 cursor-pointer transition-all hover:translate-x-0.5 active:scale-95 bg-transparent border-0"
              title="Logout session"
            >
              <LogOut className="w-3 h-3 text-rose-500" /> Logout
            </button>
          </div>
        </div>

      </aside>

      {/* Primary mainframe area - Scrolls independently on desktop, has custom bottom padding for mobile navigation */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col pb-24 md:pb-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300" id="mainframe-view">
        
        {/* Header navigation */}
        <header className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/80 py-3.5 px-6 md:px-8 flex gap-4 items-center justify-between shrink-0" id="header-bar-action">
          <div className="flex items-center gap-3">
            <Activity className="text-indigo-600 dark:text-indigo-400 w-5 h-5 shrink-0" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Context Workspace</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Mon, 22 June 2026
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Sun/Moon Mode Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
              title={isDarkMode ? "Toggle Light Theme" : "Toggle Dark Theme"}
            >
              {isDarkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-600" />
              )}
            </button>

            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">{currentUser?.name || 'User'}'s Workspace Board</span>
          </div>
        </header>

        {/* Main Content Pane */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              tasks={tasks} 
              habits={habits}
              events={events}
              insights={insights}
              onRefreshInsights={handleRefreshCoachingInsights}
              isLoadingInsights={isLoadingInsights}
              onUpdateTaskStatus={(id, status) => handleUpdateTask(id, { status })}
              onAddTask={handleAddTask}
              setActiveTab={setActiveTab}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskPlanner 
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onOptimizeSchedule={handleOptimizeSchedule}
              isOptimizing={isOptimizing}
            />
          )}

          {activeTab === 'habits' && (
            <HabitTracker 
              habits={habits}
              onAddHabit={handleAddHabit}
              onUpdateHabit={handleUpdateHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeTab === 'calendar' && (
            <InteractiveCalendar 
              events={events}
              tasks={tasks}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === 'voice' && (
            <VoiceAssistant 
              onRefreshData={fetchData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>

        {/* Persistent Floating, Cute and highly animated companion Mitr */}
        <MitrCompanion isDarkMode={isDarkMode} userName={currentUser?.name || 'buddy'} />

      </main>

      {/* Responsive Bottom Navigation Bar (MS Teams Style) - Hidden on desktop, shown on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-slate-900 text-slate-400 flex items-center justify-around z-40 px-2 shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer active:scale-95 ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer active:scale-95 ${
            activeTab === 'tasks' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Planner</span>
        </button>

        <button
          onClick={() => setActiveTab('habits')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer active:scale-95 ${
            activeTab === 'habits' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Habits</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer active:scale-95 ${
            activeTab === 'calendar' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer active:scale-95 ${
            activeTab === 'voice' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5 fill-current text-emerald-400" />
          <span className="text-[10px] tracking-tight">Ask Mitr</span>
        </button>
      </nav>

    </div>
  );
}
