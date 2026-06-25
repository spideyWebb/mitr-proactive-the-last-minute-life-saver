import React, { useState } from 'react';
import { CalendarEvent, Task } from '../types';
import { Calendar, Clock, Plus, Trash2, ArrowLeftRight, Activity, Bookmark } from 'lucide-react';

interface InteractiveCalendarProps {
  events: CalendarEvent[];
  tasks: Task[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => void;
}

export default function InteractiveCalendar({
  events,
  tasks,
  onAddEvent,
  onDeleteEvent,
  onAddTask
}: InteractiveCalendarProps) {
  // We align with current local time Year of 2026. June 22 is Monday.
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June is 5 in 0-indexed JS Dates
  const [selectedDay, setSelectedDay] = useState(22); // Pre-select Monday 22 June 2026

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Day of week index
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  // Generate array for calendar days
  const calendarDays: Array<number | null> = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Quick state for simple event creation modal/state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('14:00');
  const [type, setType] = useState<'task' | 'meeting' | 'bill' | 'reminder' | 'focus_session'>('focus_session');
  const [durationMinutes, setDurationMinutes] = useState(45);

  const formatSelectedDate = () => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const selectedDateStr = formatSelectedDate();

  // Filter events scheduled for this day
  const dailyEvents = events.filter(e => e.date === selectedDateStr);
  const dailyTasks = tasks.filter(t => t.dueDate === selectedDateStr && t.status !== 'completed');

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (type === 'task') {
      if (onAddTask) {
        onAddTask({
          title,
          description: `Created via Calendar scheduled slot.`,
          priority: 'medium',
          difficulty: 'moderate',
          category: 'Personal',
          dueDate: selectedDateStr,
          dueTime: time,
          status: 'pending'
        });
      }
    } else {
      onAddEvent({
        title,
        date: selectedDateStr,
        time,
        type,
        durationMinutes
      });
    }

    setTitle('');
    setShowQuickAdd(false);
  };

  // Get color indicators for event types
  const getEventColors = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400';
      case 'bill': return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-450';
      case 'focus_session': return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-450';
      default: return 'bg-card-elevated border-border-default text-secondary-text';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="interactive-calendar-system">
      
      {/* Calendar Grid Box */}
      <div className="bg-card rounded-2xl border border-border-default shadow-xs p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base md:text-lg font-bold text-main-text flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Dynamic Deadline Calendar
            </h2>
            <p className="text-xs text-muted-text">June 2026 evaluation period. Click any square to set day schedule.</p>
          </div>
          
          <div className="text-sm font-semibold text-secondary-text bg-card-elevated border border-border-default px-3 py-1 rounded-lg">
            {monthName} {currentYear}
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono font-bold tracking-wider text-muted-text uppercase mb-2">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Monthly squares */}
        <div className="grid grid-cols-7 gap-1.5 min-h-[250px]">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-slate-50/20 dark:bg-slate-900/10 rounded-lg"></div>;
            }

            const mm = String(currentMonth + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            const dateStr = `${currentYear}-${mm}-${dd}`;

            // Check if day has deadlines, events or tasks
            const dayEvents = events.filter(e => e.date === dateStr);
            const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== 'completed');
            const hasActivity = dayEvents.length > 0 || dayTasks.length > 0;
            const isToday = day === 22 && currentMonth === 5; // Monday June 22

            const isSelected = selectedDay === day;

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                className={`relative p-3.5 rounded-xl text-xs md:text-sm cursor-pointer transition-all flex flex-col justify-between items-center ${
                  isSelected 
                    ? 'bg-primary text-white font-bold scale-103 shadow-md border-transparent shadow-primary/20' 
                    : isToday
                    ? 'bg-primary-glow text-primary border border-primary/25 font-bold hover:bg-primary/20'
                    : 'bg-card-elevated hover:bg-border-default/60 border border-border-default text-main-text'
                }`}
              >
                <span>{day}</span>
                
                {/* Dot markers */}
                {hasActivity && (
                  <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                    isSelected ? 'bg-emerald-400' : 'bg-indigo-500'
                  }`}></span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3.5 bg-card-elevated rounded-xl border border-border-default text-[11px] text-muted-text flex items-center justify-between">
          <span>📅 Highly active days contain dot indicators. Make sure no 2 high-priority items clashing.</span>
          <span className="font-semibold text-secondary-text font-mono">Month Target Completes</span>
        </div>
      </div>

      {/* Hourly Timeline and list for selected day */}
      <div className="premium-card rounded-2xl p-6 flex flex-col justify-between max-h-[500px]">
        <div>
          <div className="flex items-center justify-between border-b border-border-default pb-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-main-text text-sm md:text-base">
                Schedules for {selectedDay} {monthName}
              </h3>
              <p className="text-[11px] text-muted-text">Total metrics allocated on selected date.</p>
            </div>

            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="p-2 bg-card-elevated border border-border-default hover:bg-border-default text-secondary-text rounded-lg transition-all duration-200 active:scale-90 shrink-0 cursor-pointer"
              title="Add quick calendar focus reminder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showQuickAdd && (
            <form onSubmit={handleCreateEvent} className="mb-4 bg-card-elevated p-4 rounded-xl border border-primary/20 space-y-3" id="quick-event-add">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is scheduled? (e.g. 'Pay bill'..."
                className="w-full px-3 py-2 rounded-lg outline-none text-main-text text-xs transition-all premium-input"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-text block mb-1">Timing</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs text-main-text outline-none premium-input"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-text block mb-1">Target Action</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs text-main-text outline-none premium-input"
                  >
                    <option value="focus_session">Focus Session</option>
                    <option value="task">Create Real Task</option>
                    <option value="meeting">Review Meeting</option>
                    <option value="bill">Bill Payment</option>
                    <option value="reminder">Task Reminder</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-3 py-1.5 bg-card border border-border-default hover:bg-card-elevated tracking-wide font-bold rounded-lg text-secondary-text transition cursor-pointer active:scale-95"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition cursor-pointer active:scale-95"
                >
                  Save Event
                </button>
              </div>
            </form>
          )}

          {/* Combined Items Stack */}
          <div className="space-y-3 overflow-y-auto max-h-[350px] scrollbar-thin">
            {dailyTasks.map(t => (
              <div key={`task-${t.id}`} className="p-3 border-l-4 border-l-amber-400 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-border-default flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">Active Deadline Task</span>
                  <h4 className="font-semibold text-main-text text-xs md:text-sm">{t.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-muted-text font-mono">
                    <Clock className="w-3 h-3" /> Due {t.dueTime || 'All Day'}
                  </div>
                </div>
                {t.priority === 'high' && (
                  <span className="text-[8px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0 font-mono">CRITICAL</span>
                )}
              </div>
            ))}

            {dailyEvents.length > 0 ? (
              dailyEvents.map(e => (
                <div key={e.id} className={`p-3 border-l-4 rounded-xl border flex items-start justify-between ${getEventColors(e.type)}`}>
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold opacity-80">{e.type.replace('_', ' ')}</span>
                    <h4 className="font-semibold text-xs md:text-sm leading-tight">{e.title}</h4>
                    {e.description && <p className="text-[10px] opacity-70 leading-relaxed">{e.description}</p>}
                    <div className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                      <Clock className="w-3 h-3" /> {e.time || 'All Day'} ({e.durationMinutes}m duration)
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteEvent(e.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : null}

            {dailyEvents.length === 0 && dailyTasks.length === 0 && (
              <div className="py-12 text-center text-muted-text text-xs flex flex-col items-center justify-center gap-1.5 bg-card-elevated border border-border-default rounded-xl">
                <span>🍀</span>
                <span className="font-medium text-secondary-text">Free Slot Layout!</span>
                <p className="text-[10px] text-muted-text max-w-[150px]">No conflicting schedules configured on selected day.</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-muted-text font-mono text-center pt-4 border-t border-border-default mt-2">
          Allocated local time track: UTC+0
        </div>
      </div>

    </div>
  );
}
