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
  ListTodo
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

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title,
      description,
      priority,
      difficulty,
      category,
      dueDate,
      dueTime,
      status: 'pending'
    });

    // Reset clean states
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDifficulty('easy');
    setCategory('Education');
    setDueDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
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
          <div className="border-b border-border-default pb-3 mb-2">
            <h3 className="font-display font-bold text-main-text text-sm md:text-base">Plan a new assignment or item</h3>
            <p className="text-xs text-muted-text mt-0.5">Ensure optimal details so the AI scheduler works most effectively.</p>
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
    </div>
  );
}
