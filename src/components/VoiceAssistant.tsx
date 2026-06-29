import React, { useState, useEffect } from 'react';
import { Mic, Send, Sparkles, Clock, Loader, MessageCircle, MicOff } from 'lucide-react';
import { VoiceReframeResult } from '../types';

interface VoiceAssistantProps {
  onRefreshData: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function VoiceAssistant({ onRefreshData, activeTab, setActiveTab }: VoiceAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; actionApplied?: string }>>([
    {
      sender: 'ai',
      text: "Namaste! Main aapka proactive productivity guide hoon. Aap tension me hain ya koi bacha kaam yaad aaya? Voice command dejiye ya niche likhiye (Jaise: 'yaar project presentation ke liye slides review karna hai' ya 'gym jane ki habit start karni hai'). Main use categorize aur schedule kar dunga!"
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check for browser speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'hi-IN'; // Set to Hindi/Indian English support
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleToggleRecord = () => {
    if (!recognition) {
      alert("Browser speech recognition is not supported in this frame. Please use the preset short voice clips below or type your request!");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      setInputText('');
      recognition.start();
    }
  };

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    // Add user message to history
    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/voice-reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data: VoiceReframeResult = await response.json();

      let actionApplied = '';
      if (data.messageType === 'task') {
        actionApplied = '✅ Created new task under Task Planner & assigned optimal schedules.';
      } else if (data.messageType === 'habit') {
        actionApplied = '✅ Initiated new Daily Habit Tracker entry.';
      } else if (data.messageType === 'calendar_event') {
        actionApplied = '✅ Scheduled directly in interactive calendar grid.';
      }

      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: data.assistantResponse,
        actionApplied: actionApplied || undefined
      }]);

      // Trigger automatic metrics reload
      onRefreshData();
      
      // Auto redirect to relevant tab to show user what happened
      setTimeout(() => {
        if (data.messageType === 'task') setActiveTab('tasks');
        else if (data.messageType === 'habit') setActiveTab('habits');
        else if (data.messageType === 'calendar_event') setActiveTab('calendar');
      }, 1500);

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: "Koshish acchi thi par connectivity me thoda loop ho gaya! Please try again or create directly."
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Preset vocal prompts for easy evaluation testing
  const voicePresets = [
    { label: "Pay electric bill", phrase: "broadband broadband broadband nahi, pay electricity bill before Friday priority high" },
    { label: "College homework", phrase: "college ka math assignment compile karna hai kafi mushkil lag raha hai" },
    { label: "Drink Water Habit", phrase: "daily track karo, drink 3 liters water habit loop scale me dalo" },
    { label: "Presentation dry run", phrase: "final presentation slideshow dry-run tomorrow 3pm meeting block lagado" }
  ];

  return (
    <div className="bg-card rounded-2xl border border-border-default shadow-sm overflow-hidden flex flex-col h-[500px]" id="voice-assistant-card">
      {/* Header */}
      <div className="bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm md:text-base">Mitr - Proactive Voice Companion</h3>
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              AI Active Listening
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full font-mono">
          Model: gemini-2.5-flash
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-card-elevated min-h-[250px] scrollbar-thin">
        {chatHistory.map((chat, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col max-w-[85%] ${chat.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div 
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                chat.sender === 'user' 
                  ? 'bg-primary text-white rounded-br-none shadow-md' 
                  : 'bg-card border border-border-default text-main-text rounded-bl-none shadow-xs font-semibold'
              }`}
            >
              <p className="whitespace-pre-line">{chat.text}</p>
              
              {chat.actionApplied && (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-500 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {chat.actionApplied}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-text mt-1 uppercase font-mono tracking-wider px-1">
              {chat.sender === 'user' ? 'You' : 'Mitr AI'}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-text text-xs italic bg-card border border-border-default px-4 py-2 rounded-full w-max mr-auto animate-pulse">
            <Loader className="w-4 h-4 animate-spin text-emerald-500" />
            AI is analyzing your workload details & planning elements...
          </div>
        )}
      </div>

      {/* Audio Sample Presets */}
      <div className="px-4 py-2 bg-card-elevated border-t border-border-default flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-text font-medium mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Hindi Speak Presets:
        </span>
        {voicePresets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset.phrase)}
            disabled={loading || isRecording}
            className="text-xs px-2.5 py-1 rounded-md bg-card border border-border-default hover:bg-card-elevated text-secondary-text cursor-pointer transition-colors duration-150"
          >
            "{preset.label}"
          </button>
        ))}
      </div>

      {/* Input controls */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
        className="p-3 bg-card border-t border-border-default flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`p-3 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            isRecording 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-card-elevated border border-border-default hover:bg-border-default/50 text-secondary-text'
          }`}
          title={isRecording ? "Stop recording" : "Record voice input (Hindi/English)"}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? "Listening closely... Speak now!" : "Ask AI to plan: 'yaar exam revision 25 tarik ko schedule karo'..."}
          className="flex-1 px-4 py-2.5 bg-card-elevated focus:bg-card border border-border-default focus:border-primary rounded-xl outline-none text-main-text text-sm transition-all"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="p-3 bg-primary hover:bg-primary/95 disabled:opacity-55 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer border-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
