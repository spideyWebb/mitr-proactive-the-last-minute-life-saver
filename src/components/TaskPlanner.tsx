import React, { useState } from 'react';
import { Task, SubTask } from '../types';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  Clock, 
  AlertCircle, 
  Loader, 
  Calendar, 
  CheckSquare2,
  Bookmark,
  CalendarCheck,
  ListTodo,
  Bell,
  X,
  Mail,
  Phone
} from 'lucide-react';

interface TaskPlannerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => void;
  onUpdateTask: (id: string, updatedFields: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onOptimizeSchedule: () => void;
  isOptimizing: boolean;
}

export default function TaskPlanner({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onOptimizeSchedule,
  isOptimizing
}: TaskPlannerProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'complex'>('easy');
  const [category, setCategory] = useState('Education');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('12:00');

  // Decompress loading states mapping task ID to loading boolean
  const [decompressingIds, setDecompressingIds] = useState<Record<string, boolean>>({});

  // Remind Me states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMethod, setReminderMethod] = useState<'email' | 'sms'>('email');
  const [reminderTarget, setReminderTarget] = useState('');
  const [reminderOffsetType, setReminderOffsetType] = useState<'30m' | '15m' | '1h' | '2h' | 'custom'>('30m');
  const [reminderCustomOffset, setReminderCustomOffset] = useState<number>(30);
  const [reminderConfigured, setReminderConfigured] = useState(false);
  const [reminderToastMessage, setReminderToastMessage] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Dynamic reminder time computer
  const getCalculatedReminderTime = (dueTimeStr: string, offsetMins: number) => {
    if (!dueTimeStr) return '11:30';
    try {
      const [h, m] = dueTimeStr.split(':').map(Number);
      let totalMins = h * 60 + m - offsetMins;
      if (totalMins < 0) totalMins = (24 * 60 + totalMins) % (24 * 60); // Wrap around midnight
      const calculatedH = Math.floor(totalMins / 60);
      const calculatedM = totalMins % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(calculatedH)}:${pad(calculatedM)}`;
    } catch (e) {
      return '11:30';
    }
  };

  const handleSendTestEmail = async () => {
    if (!reminderTarget.trim()) {
      alert("Please enter a valid recipient address first!");
      return;
    }
    
    setIsSendingTest(true);
    const offsetMins = reminderOffsetType === 'custom' ? reminderCustomOffset : (reminderOffsetType === '15m' ? 15 : reminderOffsetType === '1h' ? 60 : reminderOffsetType === '2h' ? 120 : 30);
    const computedTime = getCalculatedReminderTime(dueTime, offsetMins);
    const offsetLabel = reminderOffsetType === 'custom' ? `${reminderCustomOffset} min` : (reminderOffsetType === '15m' ? '15 min' : reminderOffsetType === '1h' ? '1 hour' : reminderOffsetType === '2h' ? '2 hours' : '30 min');
    
    let loggedUserEmail = 'user@example.com';
    let loggedUserName = 'Productive Mind';
    try {
      const stored = localStorage.getItem('mitr_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        loggedUserEmail = parsed.email || loggedUserEmail;
        loggedUserName = parsed.name || loggedUserName;
      }
    } catch (e) {}
    
    const emailSubject = `🔔 [Mitr AI Cognitive Planner] Alert: "${title || 'Sample Assignment'}"`;
    const emailBody = `Pranaam ${loggedUserName} (${loggedUserEmail})!

Your Mitr AI Cognitive Guard has triggered a real-time proactive alert for your planned task.

--------------------------------------------------
Task Summary Detail:
- Title: ${title || 'Unnamed Task / Test Assignment'}
- Priority Level: ${priority.toUpperCase()}
- Due Date: ${dueDate}
- Target Due Time: ${dueTime}
- Configured Warning Offset: ${offsetLabel} before due time
- Calculated Alert Dispatch Time: ${computedTime}
--------------------------------------------------

This is a real-time notification sent from your Mitr Cognitive Co-pilot dashboard. Your scheduling is active.

Dhanyawaad,
Mitr AI Assistant Team`;

    try {
      // Send directly from browser (client-side) to bypass server IP blocklists and ensure proper Referer headers
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(reminderTarget.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: emailSubject,
          name: 'Mitr AI Cognitive Assistant',
          email: 'assistant@mitr.ai',
          message: emailBody,
          _template: 'box'
        })
      });

      const resData = await response.json();
      if (response.ok) {
        if (resData.success === 'false' || resData.success === false || (resData.message && resData.message.toLowerCase().includes('activate'))) {
          // First-time activation triggered!
          setReminderToastMessage(`⚠️ Action Required: Please check your inbox (or spam/promotions) for a "FormSubmit - Activate" email for ${reminderTarget}, and click the confirmation link to start receiving your automated alerts!`);
        } else {
          setReminderToastMessage(`🎉 Real email alert successfully dispatched to ${reminderTarget}! Please check your Inbox (and Spam/Promotions folder).`);
        }
        setReminderConfigured(true);
        setShowReminderModal(false);
      } else {
        // Fallback to server-side API proxy
        console.warn('Direct FormSubmit call failed, falling back to server-side proxy...');
        const fallbackResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: reminderTarget,
            subject: emailSubject,
            body: emailBody,
          }),
        });

        const fallbackData = await fallbackResponse.json();
        if (fallbackResponse.ok) {
          setReminderToastMessage(`📧 Real email scheduled via fallback to ${reminderTarget}! Please verify your activation link in your inbox.`);
          setReminderConfigured(true);
          setShowReminderModal(false);
        } else {
          alert(`Failed to send email: ${fallbackData.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      console.warn('Direct FormSubmit failed, trying server-side proxy...', err);
      try {
        const fallbackResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: reminderTarget,
            subject: emailSubject,
            body: emailBody,
          }),
        });

        const fallbackData = await fallbackResponse.json();
        if (fallbackResponse.ok) {
          setReminderToastMessage(`📧 Real email scheduled via fallback to ${reminderTarget}! Please ensure you activate the email if it's the first time.`);
          setReminderConfigured(true);
          setShowReminderModal(false);
        } else {
          alert(`Failed to dispatch alert: ${fallbackData.error || 'Unknown error'}`);
        }
      } catch (fallbackErr: any) {
        console.error('All email routes failed:', fallbackErr);
        alert(`Network error while dispatching test email: ${fallbackErr.message}`);
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveReminder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reminderTarget.trim()) {
      alert('Please enter a valid email address.');
      return;
    }
    setReminderConfigured(true);
    setShowReminderModal(false);

    // Show custom success toast message
    const offsetLabel = reminderOffsetType === 'custom' ? `${reminderCustomOffset} min` : (reminderOffsetType === '15m' ? '15 min' : reminderOffsetType === '1h' ? '1 hour' : reminderOffsetType === '2h' ? '2 hours' : '30 min');
    const computedTime = getCalculatedReminderTime(dueTime, reminderOffsetType === 'custom' ? reminderCustomOffset : (reminderOffsetType === '15m' ? 15 : reminderOffsetType === '1h' ? 60 : reminderOffsetType === '2h' ? 120 : 30));
    setReminderToastMessage(`Mitr Proactive: EMAIL alert scheduled at ${computedTime} (${offsetLabel} before task deadline) for ${reminderTarget}`);
    
    // Auto clear toast after 6 seconds
    setTimeout(() => {
      setReminderToastMessage(null);
    }, 6000);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDescription = description;
    let reminderEmail: string | undefined = undefined;
    let reminderTime: string | undefined = undefined;
    let reminderTimestamp: number | undefined = undefined;

    if (reminderConfigured && reminderTarget.trim()) {
      const offsetMins = reminderOffsetType === 'custom' ? reminderCustomOffset : (reminderOffsetType === '15m' ? 15 : reminderOffsetType === '1h' ? 60 : reminderOffsetType === '2h' ? 120 : 30);
      const offsetLabel = reminderOffsetType === 'custom' ? `${reminderCustomOffset} min` : (reminderOffsetType === '15m' ? '15 min' : reminderOffsetType === '1h' ? '1 hour' : reminderOffsetType === '2h' ? '2 hours' : '30 min');
      const timeStr = getCalculatedReminderTime(dueTime, offsetMins);
      finalDescription += `${description ? '\n\n' : ''}🔔 [Mitr Proactive Alert: Simulated EMAIL reminder set for ${reminderTarget} at ${timeStr} (${offsetLabel} before task deadline)]`;
      
      reminderEmail = reminderTarget.trim();
      reminderTime = timeStr;
      try {
        const localReminderDate = new Date(`${dueDate}T${timeStr}:00`);
        reminderTimestamp = localReminderDate.getTime();
      } catch (err) {
        console.error('Error constructing reminder timestamp:', err);
      }
    }

    // Calculate timezone offset
    const offsetMinsLocal = new Date().getTimezoneOffset();
    const sign = offsetMinsLocal > 0 ? '-' : '+';
    const absOffset = Math.abs(offsetMinsLocal);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const mins = String(absOffset % 60).padStart(2, '0');
    const tzString = `${sign}${hours}:${mins}`;

    onAddTask({
      title,
      description: finalDescription,
      priority,
      difficulty,
      category,
      dueDate,
      dueTime,
      status: 'pending',
      reminderEmail,
      reminderTime,
      reminderTimestamp,
      reminderSent: false,
      timezoneOffset: tzString
    });

    // Reset clean states
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDifficulty('easy');
    setCategory('Education');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('12:00');
    setShowAddForm(false);

    // Reset reminder states
    setReminderConfigured(false);
    setReminderTarget('');
  };

  const handleDecompress = async (task: Task) => {
    setDecompressingIds(prev => ({ ...prev, [task.id]: true }));
    try {
      const res = await fetch('/api/ai/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.description })
      });
      const schemaSteps = await res.json();
      
      const newSubtasks: SubTask[] = schemaSteps.map((step: any, idx: number) => ({
        id: `${task.id}-sub-${idx}`,
        title: step.title,
        completed: false,
        estimatedMinutes: step.estimatedMinutes
      }));

      // Update task subtasks & augment difficulty to reflect complex microsteps
      onUpdateTask(task.id, { 
        subtasks: newSubtasks,
        difficulty: 'complex',
        aiRationale: 'AI resolved this high-blocker task and generated immediate microsteps to make starting extremely easy.'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDecompressingIds(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    onUpdateTask(taskId, { subtasks: updatedSubtasks });
  };

  return (
    <div className="space-y-6" id="task-planner-workspace">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 premium-card p-6 rounded-2xl">
        <div>
          <h2 className="text-lg md:text-xl font-display font-bold text-main-text tracking-tight flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" /> Cognitive Task Planner
          </h2>
          <p className="text-xs text-muted-text mt-1">Add tasks and leverage Mitr's auto-prioritization scheduler to plan efficiently.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOptimizeSchedule}
            disabled={isOptimizing || tasks.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-primary-glow to-primary-glow/50 hover:from-primary-glow hover:to-primary-glow border border-primary/25 text-primary font-bold text-xs md:text-sm rounded-xl cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isOptimizing ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-primary" />
                Scheduler recalculating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-primary fill-current" />
                Auto-Optimize Scheduler (AI)
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs md:text-sm rounded-xl cursor-pointer transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Custom Task
          </button>
        </div>
      </div>

      {/* Slide-out / inline Add form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="premium-card p-6 space-y-4 rounded-2xl border-primary/25" id="new-task-form">
          <div className="border-b border-border-default pb-3 mb-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-main-text text-sm md:text-base">Plan a new assignment or item</h3>
              <p className="text-xs text-muted-text mt-0.5">Ensure optimal details so the AI scheduler works most effectively.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!reminderTarget.trim()) {
                  let loggedEmail = 'user@example.com';
                  try {
                    const stored = localStorage.getItem('mitr_user');
                    if (stored) {
                      const parsed = JSON.parse(stored);
                      loggedEmail = parsed.email || loggedEmail;
                    }
                  } catch (e) {}
                  setReminderTarget(loggedEmail);
                }
                setShowReminderModal(true);
              }}
              className={`px-3 py-1.5 flex items-center gap-1.5 rounded-xl border text-[11px] md:text-xs font-bold transition cursor-pointer select-none active:scale-95 shrink-0 ${
                reminderConfigured
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-extrabold shadow-sm shadow-amber-500/10 animate-pulse'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${reminderConfigured ? 'fill-current animate-bounce' : ''}`} />
              {reminderConfigured ? 'Reminder Configured' : 'Remind Me'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Task title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Examples: 'Study Springboot dependency injects' or 'clear cell billing'..."
                className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm transition-all premium-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Category / Domain</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm transition-all premium-input"
              >
                <option value="Education">Education / Study</option>
                <option value="Work">Work / Entrepreneurship</option>
                <option value="Bills">Bills & Payments</option>
                <option value="Health">Health & Wellness</option>
                <option value="Personal">Personal Projects</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary-text block">Short description notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this item blocker? Write notes, dates, links, panel evaluates or credentials here."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm transition-all premium-input"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Initial Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm premium-input"
              >
                <option value="high">🔥 High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">🌱 Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Task Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-main-text text-sm premium-input"
              >
                <option value="easy">Easy (Routine)</option>
                <option value="moderate">Moderate (Takes effort)</option>
                <option value="complex">Complex (Feels overwhelming)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Due date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl outline-none text-main-text text-sm premium-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary-text block">Suggested timing</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl outline-none text-main-text text-sm premium-input"
              />
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
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-sm shadow-primary/20"
            >
              Confirm & Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filtering Row */}
      <div className="flex border-b border-border-default gap-4" id="task-list-filters">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2.5 text-xs md:text-sm font-medium border-b-2 px-1 transition cursor-pointer ${
            filter === 'all' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-muted-text hover:text-secondary-text'
          }`}
        >
          All Items ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`pb-2.5 text-xs md:text-sm font-medium border-b-2 px-1 transition cursor-pointer ${
            filter === 'pending' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-muted-text hover:text-secondary-text'
          }`}
        >
          Active Assignments ({tasks.filter(t => t.status !== 'completed').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`pb-2.5 text-xs md:text-sm font-medium border-b-2 px-1 transition cursor-pointer ${
            filter === 'completed' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-muted-text hover:text-secondary-text'
          }`}
        >
          Completed Logs ({tasks.filter(t => t.status === 'completed').length})
        </button>
      </div>

      {/* Master Task List Grid */}
      <div className="space-y-4" id="tasks-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isDecompressing = decompressingIds[task.id] || false;

            return (
              <div 
                key={task.id} 
                className={`bg-card rounded-2xl border border-border-default p-5 shadow-xs transition-all duration-200 hover:shadow-sm ${
                  isCompleted 
                    ? 'border-border-default opacity-60 bg-card-elevated/50' 
                    : task.status === 'in_progress'
                    ? 'border-l-4 border-l-amber-500 border-border-default'
                    : task.priority === 'high' 
                    ? 'border-l-4 border-l-rose-500 border-border-default' 
                    : 'border-l-4 border-l-emerald-400 border-border-default'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Status checkbox toggle */}
                    <button
                      onClick={() => onUpdateTask(task.id, { status: isCompleted ? 'pending' : 'completed' })}
                      className="mt-1 transition cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckSquare2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                      ) : task.status === 'in_progress' ? (
                        <div className="w-5 h-5 rounded-md border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center animate-pulse" title="In Progress">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        </div>
                      ) : (
                        <Square className="w-5 h-5 text-muted-text hover:text-secondary-text" />
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-semibold text-main-text text-sm md:text-base leading-snug ${
                          isCompleted ? 'line-through text-muted-text opacity-75' : ''
                        }`}>
                          {task.title}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono uppercase bg-card-elevated text-secondary-text border border-border-default">
                          {task.category}
                        </span>

                        {task.status === 'in_progress' && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            In Progress
                          </span>
                        )}
                        
                        {task.isAIPrioritized && (
                          <span className="text-[10px] bg-primary-glow text-primary border border-primary/25 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" /> Auto-Aligned
                          </span>
                        )}
                      </div>

                      <p className="text-secondary-text text-xs md:text-sm max-w-xl">
                        {task.description || 'No additional details.'}
                      </p>

                      {/* Timeline dates info */}
                      <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-muted-text pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Due: {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                        </span>
                        <span className="capitalize">Difficulty: {task.difficulty}</span>
                        {task.aiSchedules && task.aiSchedules.length > 0 && (
                          <span className="text-primary font-semibold">
                            AI Windows: {task.aiSchedules.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Jira Status Workflow Transitions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-2 border-t border-border-default">
                        <span className="text-[9px] text-muted-text font-bold uppercase tracking-wider">Workflow:</span>
                        <div className="inline-flex rounded-lg p-0.5 bg-card-elevated border border-border-default">
                          <button
                            type="button"
                            onClick={() => onUpdateTask(task.id, { status: 'pending' })}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition duration-150 cursor-pointer ${
                              task.status === 'pending'
                                ? 'bg-card text-primary shadow-xs'
                                : 'text-muted-text hover:text-main-text'
                            }`}
                          >
                            To Do
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition duration-150 cursor-pointer ${
                              task.status === 'in_progress'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-muted-text hover:text-main-text'
                            }`}
                          >
                            In Progress
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateTask(task.id, { status: 'completed' })}
                            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition duration-150 cursor-pointer ${
                              task.status === 'completed'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'text-muted-text hover:text-main-text'
                            }`}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center gap-2">
                    {!isCompleted && task.subtasks.length === 0 && (
                      <button
                        onClick={() => handleDecompress(task)}
                        disabled={isDecompressing}
                        className="text-[10px] md:text-xs px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
                      >
                        {isDecompressing ? (
                          <>
                            <Loader className="w-3 h-3 animate-spin" /> decompressing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-500" /> AI Decompress (Steps)
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-muted-text rounded-lg transition overflow-hidden cursor-pointer"
                      title="Delete task permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks rendering */}
                {task.subtasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border-default space-y-2 pl-8">
                    <div className="flex items-center justify-between text-[11px] text-muted-text uppercase tracking-widest font-mono">
                      <span>Proactive microsteps layout:</span>
                      <span>
                        {task.subtasks.filter(s => s.completed).length} of {task.subtasks.length} done
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {task.subtasks.map((st) => (
                        <div 
                          key={st.id} 
                          onClick={() => toggleSubtask(task.id, st.id)}
                          className={`flex items-center gap-2.5 p-2 bg-card-elevated hover:bg-border-default/50 rounded-xl cursor-default border border-border-default transition ${
                            st.completed ? 'opacity-60 bg-emerald-500/5' : ''
                          }`}
                        >
                          <button className="text-muted-text">
                            {st.completed ? (
                              <CheckSquare2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-text" />
                            )}
                          </button>
                          <div className="text-xs">
                            <span className={`text-secondary-text font-medium ${st.completed ? 'line-through text-muted-text opacity-70' : ''}`}>
                              {st.title}
                            </span>
                            {st.estimatedMinutes && (
                              <span className="text-[9px] text-muted-text font-mono italic block mt-0.5">
                                Est. duration: {st.estimatedMinutes} mins
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Rationale note */}
                {task.aiRationale && !isCompleted && (
                  <div className="mt-4 p-3 bg-primary-glow border border-primary/20 rounded-xl text-xs text-primary flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Mitr Advisor comment:</strong> {task.aiRationale}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 bg-card rounded-2xl border border-border-default shadow-xs text-center space-y-2">
            <span className="text-3xl">💤</span>
            <h4 className="font-semibold text-main-text text-sm md:text-base">List fully clean!</h4>
            <p className="text-xs text-muted-text max-w-sm mx-auto p-4">You have zero pending items inside this filter category. Try speaking "yaar presentation ki dry run schedule kardo 3 baje" using our AI voice companion above!</p>
          </div>
        )}
      </div>

      {/* Toast Alert Notification */}
      {reminderToastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] max-w-md bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-bounce-slow">
          <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs md:text-sm text-white flex items-center gap-1.5">
              <span>Mitr Proactive Guard Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{reminderToastMessage}</p>
          </div>
          <button 
            onClick={() => setReminderToastMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Remind Me Settings Modal popup */}
      {showReminderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-left scrollbar-thin">
            {/* Background decorative glow */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full filter blur-2xl -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full filter blur-2xl translate-y-1/2"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/25">
                  <Bell className="w-5 h-5 animate-bounce-slow" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base md:text-lg text-white">Mitr Proactive Alerts</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Configure real-time automated task warnings</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReminderModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 relative z-10">
              {/* Target Address Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={reminderTarget}
                  onChange={(e) => setReminderTarget(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 focus:border-indigo-500/45 rounded-xl outline-none text-slate-200 text-sm transition-all shadow-inner font-mono"
                />
              </div>

              {/* Timing Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Suggested Timing Offset</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: '15m', label: '15 Min Before', mins: 15 },
                    { type: '30m', label: '30 Min Before (Default)', mins: 30 },
                    { type: '1h', label: '1 Hour Before', mins: 60 },
                    { type: '2h', label: '2 Hours Before', mins: 120 }
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setReminderOffsetType(opt.type as any)}
                      className={`py-2 px-3 rounded-xl border font-bold text-[11px] text-left transition cursor-pointer ${
                        reminderOffsetType === opt.type
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 font-extrabold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReminderOffsetType('custom')}
                    className={`col-span-2 py-2 px-3 rounded-xl border font-bold text-[11px] text-center transition cursor-pointer ${
                      reminderOffsetType === 'custom'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 font-extrabold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    Custom Minute Offset
                  </button>
                </div>
              </div>

              {/* Custom Offset Number Selector */}
              {reminderOffsetType === 'custom' && (
                <div className="space-y-1.5 p-3 bg-slate-950/50 border border-slate-850 rounded-xl animate-fade-in">
                  <label className="text-[11px] font-semibold text-slate-400 block">Custom Offset (Minutes)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={1440}
                      value={reminderCustomOffset}
                      onChange={(e) => setReminderCustomOffset(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs outline-none focus:border-amber-500/40"
                    />
                    <span className="text-xs text-slate-400">minutes before task deadline time</span>
                  </div>
                </div>
              )}

              {/* Dynamic Warning Preview */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block">Calculated Dynamic Alarm Trigger</span>
                  <p className="text-xs text-slate-300">
                    With target due time set to <strong className="text-indigo-400 font-mono">{dueTime}</strong>, your proactive alert will fire at:{' '}
                    <strong className="text-emerald-400 font-mono text-sm block mt-1">
                      {getCalculatedReminderTime(dueTime, reminderOffsetType === 'custom' ? reminderCustomOffset : (reminderOffsetType === '15m' ? 15 : reminderOffsetType === '1h' ? 60 : reminderOffsetType === '2h' ? 120 : 30))}
                    </strong>
                  </p>
                </div>
              </div>

              {/* FormSubmit Setup Steps */}
              <div className="space-y-2 pt-1">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span>⚠️ FormSubmit First-Time Activation</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    FormSubmit requires a <strong>one-time confirmation</strong> per recipient email. If you haven't activated <strong>{reminderTarget || 'your email'}</strong> yet, please complete both steps below:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* STEP 1: Standard Submit for Activation */}
                    <form
                      action={`https://formsubmit.co/${reminderTarget.trim()}`}
                      method="POST"
                      target="_blank"
                      className="w-full"
                    >
                      <input type="hidden" name="_subject" value="Activate Mitr AI Cognitive Planner Alerts" />
                      <input type="hidden" name="message" value="Welcome to Mitr AI Cognitive Planner! Please activate this email address to allow background task notifications." />
                      <input type="hidden" name="_next" value={window.location.href} />
                      <button
                        type="submit"
                        disabled={!reminderTarget.trim()}
                        className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold transition text-[11px] flex items-center justify-center gap-1.5 cursor-pointer select-none shadow-md active:scale-[0.98]"
                      >
                        <span>Step 1: Activate Email ↗️</span>
                      </button>
                    </form>

                    {/* STEP 2: Send AJAX alert */}
                    <button
                      type="button"
                      disabled={isSendingTest || !reminderTarget.trim()}
                      onClick={handleSendTestEmail}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-emerald-800/40 disabled:to-teal-800/40 text-white font-extrabold transition text-[11px] flex items-center justify-center gap-1.5 cursor-pointer select-none shadow-md active:scale-[0.98]"
                    >
                      {isSendingTest ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Step 2: Send Test Alert 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setReminderConfigured(false);
                    setShowReminderModal(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-850 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white font-bold transition text-xs cursor-pointer select-none"
                >
                  Disable Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveReminder()}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs shadow-md cursor-pointer select-none"
                >
                  Confirm Guard Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
