export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  difficulty: 'easy' | 'moderate' | 'complex';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  createdAt: string;
  category: string;
  subtasks: SubTask[];
  aiSchedules?: string[]; // Recommended visual windows
  isAIPrioritized?: boolean;
  aiRationale?: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: Record<string, boolean>; // date string -> completed
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  durationMinutes?: number;
  taskId?: string;
  type: 'task' | 'meeting' | 'bill' | 'reminder' | 'focus_session';
}

export interface CoachingInsight {
  id: string;
  timestamp: string;
  category: 'procrastination' | 'wellness' | 'efficiency' | 'encouragement' | 'warning';
  title: string;
  message: string;
  actionableItem?: string;
}

export interface VoiceReframeResult {
  messageType: 'task' | 'habit' | 'calendar_event' | 'conversational';
  extractedData?: {
    task?: Partial<Task>;
    habit?: Partial<Habit>;
    calendarEvent?: Partial<CalendarEvent>;
  };
  assistantResponse: string; // Dynamic friendly reponse
}
