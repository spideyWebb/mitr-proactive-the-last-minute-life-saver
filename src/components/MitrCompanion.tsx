import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, X, Send, Bot, Smile, HelpCircle, Flame, ShieldAlert, HeartHandshake } from 'lucide-react';

interface MitrCompanionProps {
  isDarkMode: boolean;
  userName: string;
}

interface Message {
  id: string;
  sender: 'user' | 'mitr';
  text: string;
  time: string;
}

export default function MitrCompanion({ isDarkMode, userName }: MitrCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize dynamic greeting based on actual logged in user's name
  useEffect(() => {
    setMessages([
      {
        id: 'm-1',
        sender: 'mitr',
        text: `Aree ${userName}! Kaise ho yaar? Aaj kya plan hai? Main bilkul taiyaar hoon real-time help karne ke liye. Puchho "Kya chal rha hai?"!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [userName]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mitrMood, setMitrMood] = useState<'neutral' | 'motivated' | 'strict' | 'funny'>('neutral');
  const [hasNewBanter, setHasNewBanter] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Periodic proactive prompts from Mitr if idle!
  useEffect(() => {
    const idlePrompts = [
      "Aree suno, phone ko silent kiya kya? Chalo 15 min focus lagake ek task clear karte hain!",
      "Coffee ya paani pilaun? Water break zaroori hai dhyan badhane ke liye!",
      "Kya aap abhi procrastinate kar rahe ho? Mujhe sachi batao, main help karunga decompose karne me!",
      "Aapke High priority tasks wait kar rahe hain, check out task tracker!",
      "Chote chote steps se hi bada target hit hota hai. Let's do this!"
    ];

    const interval = setInterval(() => {
      if (!isOpen && Math.random() > 0.5) {
        setHasNewBanter(true);
      }
    }, 45000); // Check idle reminders naturally

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setHasNewBanter(false);

    try {
      const response = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, mood: mitrMood, userName })
      });
      const data = await response.json();
      
      const mitrReply: Message = {
        id: `m-${Date.now()}`,
        sender: 'mitr',
        text: data.reply || "Kuch toh gadbad hai yaar, network theek karke dobara pucho!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, mitrReply]);
    } catch (e) {
      const mitrReply: Message = {
        id: `m-${Date.now()}`,
        sender: 'mitr',
        text: "Sunna yaar, network thoda dheema hai. Par fikar mat karo! Bas ek high priority task pick karo aur phod do!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, mitrReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (promptType: 'whats_up' | 'motivation' | 'break_task' | 'water_check') => {
    let text = '';
    if (promptType === 'whats_up') {
      text = "Kya chal rha hai? Mere active pending tasks aur workload analyze karke batao yaar!";
    } else if (promptType === 'motivation') {
      text = "Aalas aa rha hai bohot tezi se, thoda high-energy motivation do please!";
    } else if (promptType === 'break_task') {
      text = "Ek bada task breakdown karwane me help chahiye.";
    } else if (promptType === 'water_check') {
      text = "Mitr, self-care audit do! Hydration break zaoori hai?";
    }
    handleSendMessage(text);
  };

  // Determine avatar icon based on mood
  const getMitrAvatarEmoji = () => {
    if (isTyping) return '⚡';
    switch (mitrMood) {
      case 'motivated': return '🔥';
      case 'strict': return '👮';
      case 'funny': return '😜';
      default: return '🧠';
    }
  };

  const getMitrMoodLabel = () => {
    switch (mitrMood) {
      case 'motivated': return 'High Energy 🔥';
      case 'strict': return 'Strict Coach 👮';
      case 'funny': return 'Masti Mode 😜';
      default: return 'Friendly Mitr 🧠';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="mitr-interactive-companion-widget">
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          {hasNewBanter && (
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-rose-500 text-[8px] text-white font-bold items-center justify-center">1</span>
            </span>
          )}
          
          {/* Pulsating companion orb */}
          <button
            onClick={() => {
              setIsOpen(true);
              setHasNewBanter(false);
            }}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border border-white/20 animate-bounce-slow"
          >
            <span className="text-2xl select-none">{getMitrAvatarEmoji()}</span>
          </button>

          {/* Quick interactive peek bubble */}
          <div className="absolute right-16 bottom-2 bg-card border border-border-default text-main-text text-xs py-2 px-3 rounded-2xl shadow-xl w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
            <div className="relative">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 inline mr-1 animate-pulse" />
              Suno {userName}! Kuch help chahiye? Click me, main bataunga kya chal raha hai!
            </div>
          </div>
        </div>
      )}

      {/* Expanded Interactive Companion Dialogue Panel */}
      {isOpen && (
        <div className="premium-card w-[calc(100vw-2.5rem)] sm:w-96 rounded-3xl overflow-hidden shadow-2xl border border-border-default flex flex-col h-[520px] bg-card animate-fade-in" id="expanded-mitr-panel">
          
          {/* Companion header */}
          <div className="bg-card p-4 text-main-text flex items-center justify-between border-b border-border-default shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-card-elevated border border-border-default flex items-center justify-center text-xl animate-pulse">
                {getMitrAvatarEmoji()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm tracking-tight">Mitr Proactive Companion</h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-muted-text font-mono tracking-wider font-semibold">
                  ACTIVE MODERATOR • {getMitrMoodLabel()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-card-elevated text-muted-text hover:text-main-text transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Persona quick switch selection */}
          <div className="bg-card-elevated border-b border-border-default px-3 py-2 flex items-center justify-between text-xs shrink-0">
            <span className="text-muted-text font-bold uppercase font-mono tracking-wider text-[10px]">Vibe Selector:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMitrMood('neutral')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  mitrMood === 'neutral' ? 'bg-primary text-white shadow-xs font-extrabold' : 'text-secondary-text hover:bg-border-default/50'
                }`}
              >
                🤝 Dost
              </button>
              <button
                onClick={() => setMitrMood('motivated')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  mitrMood === 'motivated' ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold' : 'text-secondary-text hover:bg-border-default/50'
                }`}
              >
                🔥 JOSH
              </button>
              <button
                onClick={() => setMitrMood('strict')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  mitrMood === 'strict' ? 'bg-rose-600 text-white shadow-xs font-extrabold' : 'text-secondary-text hover:bg-border-default/50'
                }`}
              >
                👮 Coach
              </button>
              <button
                onClick={() => setMitrMood('funny')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  mitrMood === 'funny' ? 'bg-fuchsia-600 text-white shadow-xs font-extrabold' : 'text-secondary-text hover:bg-border-default/50'
                }`}
              >
                😜 Masti
              </button>
            </div>
          </div>

          {/* Quick helpful instant queries (Defeats blank search paralysis) */}
          <div className="p-2.5 bg-card flex gap-2 overflow-x-auto scrollbar-none shrink-0 border-b border-border-default">
            <button
              onClick={() => handleQuickPrompt('whats_up')}
              className="px-3 py-1.5 bg-primary-glow border border-primary/20 text-primary hover:bg-primary/10 text-[11px] font-semibold rounded-full whitespace-nowrap shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 transition-all"
            >
              🤔 Kya Chal rha hai?
            </button>
            <button
              onClick={() => handleQuickPrompt('motivation')}
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold rounded-full whitespace-nowrap shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 transition-all animate-pulse"
            >
              🔥 Motivation Do!
            </button>
            <button
              onClick={() => handleQuickPrompt('break_task')}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-full whitespace-nowrap shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 transition-all"
            >
              🛠️ Break down Task
            </button>
            <button
              onClick={() => handleQuickPrompt('water_check')}
              className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[11px] font-semibold rounded-full whitespace-nowrap shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 transition-all"
            >
              🥛 Hydrate check
            </button>
          </div>

          {/* Dialogue Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4.5 scrollbar-thin bg-card-elevated">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-[13px] leading-relaxed font-semibold shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-none shadow-sm'
                      : 'bg-card border border-border-default text-main-text rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-muted-text font-mono mt-1 px-1">
                  {m.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-muted-text p-2 text-xs font-mono animate-pulse">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce delay-200"></span>
                <span>Mitr is plotting advice...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input controls bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3.5 bg-card border-t border-border-default flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything (e.g. Kya chal rha hai, buddy?)..."
              className="flex-1 text-sm border border-border-default rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary bg-card-elevated text-main-text focus:bg-card transition-all"
            />
            <button
              type="submit"
              className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 cursor-pointer active:scale-90 transition-all shadow-sm flex items-center justify-center shrink-0 border-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
