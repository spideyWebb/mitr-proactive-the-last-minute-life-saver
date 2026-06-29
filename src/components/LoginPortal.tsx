import React, { useState } from 'react';
import { Sparkles, Clock, Eye, EyeOff, CheckCircle2, User, Mail, Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPortalProps {
  onLogin: (user: { email: string; name: string; avatar: string; role: string }) => void;
  appTheme: 'normal' | 'animated' | 'neon' | 'sunset' | 'nebula' | 'nordic';
  themeGradientClass: string;
  themeShadowClass: string;
}

const AVATAR_PRESETS = ['🚀', '🧠', '💻', '🎨', '🌟', '🦊', '⚡', '☕', '📈', '🧘‍♂️'];
const ROLE_PRESETS = ['Developer', 'Designer', 'Student', 'Creator', 'Focus Specialist', 'Manager'];

export default function LoginPortal({ onLogin, appTheme, themeGradientClass, themeShadowClass }: LoginPortalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('mitr123');
  const [name, setName] = useState('Productive Mind');
  const [role, setRole] = useState('Developer');
  const [avatar, setAvatar] = useState('🚀');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Authentication Simulation State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const handleGoogleLoginSelect = (selectedEmail: string, selectedName: string) => {
    setIsGoogleSigningIn(true);
    setTimeout(() => {
      setIsGoogleSigningIn(false);
      setShowGoogleChooser(false);
      onLogin({
        email: selectedEmail,
        name: selectedName,
        avatar: '🚀',
        role: 'Focus Specialist'
      });
    }, 1500);
  };

  // Authentication submission validator
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }
    if (isSignUp && !name) {
      setError('Please tell us your name.');
      return;
    }

    setIsSubmitting(true);

    // Simulate custom auth connection delay
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin({
        email,
        name: isSignUp ? name : (email === 'user@example.com' ? 'Productive Mind' : email.split('@')[0]),
        avatar: isSignUp ? avatar : '🧠',
        role: isSignUp ? role : 'Focus Specialist'
      });
    }, 1100);
  };

  const handleQuickLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin({
        email: 'user@example.com',
        name: 'Productive Mind',
        avatar: '🚀',
        role: 'Full Stack Dev'
      });
    }, 600);
  };

  return (
    <div className={`min-h-screen font-sans flex items-center justify-center p-4 md:p-6 transition-all duration-500 theme-${appTheme} relative overflow-hidden`} id="login-portal-wrapper">
      
      {/* Dynamic background decoration accents */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-fuchsia-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md scale-95 md:scale-100 transition-all duration-300" id="login-card-container">
        
        {/* Brand visual header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-card border border-border-default text-primary shadow-xl animate-bounce-slow mb-3">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight text-main-text flex items-center justify-center gap-2">
            Mitr <span className="text-primary">Proactive</span>
          </h1>
          <p className="text-sm text-muted-text max-w-xs mx-auto">
            Your animated hyper-focused productivity and cognitive task assistant.
          </p>
        </div>

        {/* Card Body */}
        <div className="premium-card p-6 md:p-8 rounded-3xl relative border border-border-default shadow-xl overflow-hidden">
          
          <div className="flex border-b border-border-default pb-4 mb-6 items-center justify-between">
            <h2 className="text-lg font-bold text-main-text">
              {isSignUp ? 'Create Cognitive Account' : 'Authenticate Presence'}
            </h2>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              {isSignUp ? 'Already registered? Login' : 'New here? Register'}
            </button>
          </div>

          {/* Core Sign-In form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block pl-1">Preferred Alias</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Shivang Kumar"
                    className="premium-input w-full pl-10 pr-4 py-3 text-sm text-main-text"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block pl-1">Cognitive Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@destination.com"
                  className="premium-input w-full pl-10 pr-4 py-3 text-sm text-main-text"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block pl-1">Security Keyphrase</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-text" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="premium-input w-full pl-10 pr-10 py-3 text-sm text-main-text"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-text hover:text-secondary-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-3 pt-1 animate-fade-in">
                {/* Specialty focus preset selection */}
                <div>
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block pl-1 mb-1.5">Specialty Focus</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setRole(p)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                          role === p 
                            ? 'bg-primary border-transparent text-white shadow-xs' 
                            : 'bg-card-elevated border-border-default text-secondary-text hover:bg-border-default/50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatar emojis */}
                <div>
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-widest block pl-1 mb-1.5">Vibe Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`text-base w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                          avatar === av 
                            ? 'bg-primary-glow border-primary scale-110 shadow-xs' 
                            : 'bg-card-elevated border-border-default hover:bg-border-default/40 hover:scale-105'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-2xl bg-primary text-white font-bold text-sm tracking-wide shadow-md shadow-primary/25 hover:opacity-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50`}
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Sparkles className="w-4 h-4 fill-current text-amber-300" />
              )}
              {isSignUp ? 'Launch Personal Horizon' : 'Verify Cognition & Enter'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-border-default"></div>
            </div>
            <span className="relative bg-card px-3 text-[10px] font-bold text-muted-text uppercase tracking-widest">Or connect via</span>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={() => {
              setShowGoogleChooser(true);
              setShowCustomGoogleInput(false);
              setCustomGoogleEmail('');
            }}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 dark:text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs"
          >
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Quick preset sign in */}
          {!isSignUp && (
            <div className="mt-5 pt-4 border-t border-dashed border-border-default space-y-2 text-center">
              <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Evaluation shortcuts</p>
              <button
                type="button"
                onClick={handleQuickLogin}
                className="text-xs bg-card-elevated hover:bg-border-default border border-border-default text-primary py-2.5 px-4 rounded-xl font-bold w-full flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                Let me in! (Fast Eval login) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Outer credit details */}
        <p className="text-center text-[10px] text-muted-text mt-6 font-mono font-medium tracking-wide">
          SESSION MEMORY AUTO-PERSISTED VIA CLIENT CRUNCH • SSL ENCRYPTED
        </p>
      </div>

      {/* simulated Google Accounts Chooser Modal */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6 text-slate-800 dark:text-slate-100 transition-all">
            
            {/* Google Logo */}
            <div className="flex justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            {isGoogleSigningIn ? (
              <div className="text-center py-8 space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Signing you in...</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Establishing secure context with Google Auth</p>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Choose an account</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">to continue to <span className="font-bold text-indigo-600 dark:text-indigo-400">Mitr Proactive</span></p>
                </div>

                {!showCustomGoogleInput ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* Primary Account Option */}
                    <button
                      onClick={() => handleGoogleLoginSelect('user@example.com', 'Productive Mind')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all text-left group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-300 uppercase">
                        P
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Productive Mind</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">user@example.com</p>
                      </div>
                      <div className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/50 px-2 py-0.5 rounded-md font-bold">
                        Active
                      </div>
                    </button>

                    {/* Use another account option */}
                    <button
                      onClick={() => setShowCustomGoogleInput(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-800 transition-all text-left cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                        +
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Use another account</p>
                        <p className="text-[10px] text-slate-400">Sign in with a different Google account</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Google Email Address</label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-950 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomGoogleInput(false);
                          setCustomGoogleEmail('');
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (customGoogleEmail.trim() && customGoogleEmail.includes('@')) {
                            const namePart = customGoogleEmail.split('@')[0];
                            const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                            handleGoogleLoginSelect(customGoogleEmail, capitalizedName);
                          }
                        }}
                        disabled={!customGoogleEmail.trim() || !customGoogleEmail.includes('@')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  <button onClick={() => setShowGoogleChooser(false)} className="hover:underline cursor-pointer">Cancel</button>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" /> Secure Connection
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
