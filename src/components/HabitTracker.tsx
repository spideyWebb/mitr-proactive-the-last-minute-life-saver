import React, { useState } from 'react';
import { Habit } from '../types';
import { Sparkles, Calendar, Plus, Check, Loader, Trash, RefreshCw, Zap } from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string, frequency: 'daily' | 'weekly') => void;
  onUpdateHabit: (id: string, updatedFields: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
}

export default function HabitTracker({
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit
}: HabitTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [showAddForm, setShowAddForm] = useState(false);
  const [evaluatingInsights, setEvaluatingInsights] = useState<Record<string, boolean>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    onAddHabit(newHabitTitle, frequency);
    setNewHabitTitle('');
    setShowAddForm(false);
  };

  const handleToggleHabitToday = (habit: Habit) => {
    const isCompletedToday = !!habit.history[todayStr];
    const newHistory = { ...habit.history };

    if (isCompletedToday) {
      delete newHistory[todayStr];
    } else {
      newHistory[todayStr] = true;
    }

    // Recalculate streak simple approximation
    let newStreak = habit.streak;
    if (!isCompletedToday) {
      newStreak += 1;
    } else {
      newStreak = Math.max(0, newStreak - 1);
    }

    onUpdateHabit(habit.id, {
      history: newHistory,
      streak: newStreak,
      lastCompletedDate: isCompletedToday ? undefined : todayStr
    });
  };

  // AI Personalized Coach advice analyzer on a per-habit basis
  const handleFetchHabitAdvice = async (habit: Habit) => {
    setEvaluatingInsights(prev => ({ ...prev, [habit.id]: true }));
    try {
      const response = await fetch('/api/ai/voice-reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `Evaluate my consistency for habit ${habit.title}. Currently my consecutive streak is ${habit.streak} days. I want dynamic psychological advice on keeping this habit alive.`
        })
      });

      const parsed = await response.json();
      setAiInsights(prev => ({ ...prev, [habit.id]: parsed.assistantResponse }));
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingInsights(prev => ({ ...prev, [habit.id]: false }));
    }
  };

  return (
    <div className="space-y-6" id="habit-tracker-workspace">
      
      {/* Header card info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border-default shadow-xs">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-main-text flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary fill-primary/20" /> Auto-streak Habit Loops
          </h2>
          <p className="text-xs text-muted-text font-medium">Build solid neural pathways by doing little items daily. AI evaluates habit consistency ratios.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold text-xs md:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Start New Habit Loop
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateHabit} className="premium-card p-6 space-y-4 rounded-2xl border-primary/25" id="new-habit-form">
          <div className="border-b border-border-default pb-3">
            <h3 className="font-display font-bold text-main-text text-sm">Initiate routine loop</h3>
            <p className="text-xs text-muted-text mt-0.5">Regular routines lower mental decision exhaustion.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Habit Name</label>
              <input
                type="text"
                required
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="Examples: 'Mornings 10m review', 'Deep Work Block 90m'..."
                className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm transition-all premium-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Frequency Rate</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm premium-input"
              >
                <option value="daily">Daily Checklist</option>
                <option value="weekly">Weekly Routine</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 hover:bg-card-elevated text-secondary-text text-xs font-bold rounded-xl border border-border-default transition cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-primary/20"
            >
              Start Tracking Loop
            </button>
          </div>
        </form>
      )}

      {/* Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="habits-list-grid">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const isCompletedToday = !!habit.history[todayStr] || habit.lastCompletedDate === todayStr;
            const isAnalyzing = evaluatingInsights[habit.id] || false;
            const habitCoachInsight = aiInsights[habit.id] || '';

            return (
              <div 
                key={habit.id} 
                className="premium-card p-6 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono bg-primary-glow border border-primary/25 text-primary px-2 py-0.5 rounded-full font-bold">
                      {habit.frequency} LOOP
                    </span>
                    <h3 className="font-semibold text-main-text text-base leading-tight pt-1">
                      {habit.title}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-text font-mono">
                      <span>Streak:</span>
                      <strong className="text-amber-500 font-semibold">{habit.streak} consecutive days</strong>
                    </div>
                  </div>

                  {/* Tick check action circle */}
                  <button
                    onClick={() => handleToggleHabitToday(habit)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                      isCompletedToday 
                        ? 'bg-emerald-500 border-transparent text-white shadow-md shadow-emerald-500/10' 
                        : 'border-border-default hover:bg-card-elevated text-muted-text hover:text-secondary-text'
                    }`}
                    title={isCompletedToday ? "Unmark completion today" : "Complete today"}
                  >
                    {isCompletedToday ? <Check className="w-5 h-5 stroke-[3px]" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>

                {/* Week progression visual indicators */}
                <div className="bg-card-elevated p-3 rounded-xl border border-border-default">
                  <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider font-mono block mb-2">Previous 7 days logs:</span>
                  <div className="flex items-center justify-between gap-1">
                    {[...Array(7)].map((_, index) => {
                      // Date subtraction offset YYYY-MM-DD
                      const dateObj = new Date();
                      dateObj.setDate(dateObj.getDate() - (6 - index));
                      const dateString = dateObj.toISOString().split('T')[0];
                      const dayName = dateObj.toLocaleString('en-US', { weekday: 'narrow' });
                      const logged = !!habit.history[dateString] || (dateString === todayStr && isCompletedToday);

                      return (
                        <div key={index} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-[9px] text-muted-text uppercase font-mono font-medium">{dayName}</span>
                          <div className={`w-full h-2.5 rounded-full ${
                            logged ? 'bg-emerald-400' : 'bg-border-default'
                          }`} title={dateString}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI advice helper insights */}
                <div className="space-y-2">
                  {habitCoachInsight ? (
                    <div className="p-3 bg-primary-glow border border-primary/20 rounded-xl text-xs text-primary flex gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                      <span>{habitCoachInsight}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center text-xs">
                    <button
                      onClick={() => handleFetchHabitAdvice(habit)}
                      disabled={isAnalyzing}
                      className="text-primary hover:text-primary/95 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      {isAnalyzing ? 'Querying advice...' : 'Ask Coach Advice (AI)'}
                    </button>

                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-muted-text hover:text-rose-500 transition cursor-pointer"
                      title="Remove habit permanent"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="py-12 bg-card rounded-2xl border border-border-default shadow-xs text-center space-y-2 col-span-2">
            <span className="text-3xl">☕</span>
            <h4 className="font-semibold text-main-text text-sm md:text-base">No active habits started yet</h4>
            <p className="text-xs text-muted-text max-w-sm mx-auto p-4">Add high-value habits (exercise, deep code block, water intake) to auto-streak your daily metrics!</p>
          </div>
        )}
      </div>

    </div>
  );
}
