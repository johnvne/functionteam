
import React, { useState, useMemo, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { LucideLoader2, UserCircle, ShieldCheck, Lock, AlertCircle, TreePine, Gift, Sparkles, Coins, ArrowRight } from 'lucide-react';
import { ThemeContext } from '../../../App';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const festiveConfig = useMemo(() => {
    if (theme === 'noel') return {
      bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#064e3b]',
      card: 'bg-white/95',
      accent: 'bg-gradient-to-br from-red-600 to-red-800',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-900/20',
      icon: <TreePine className="text-white w-10 h-10" />,
      tag: "Christmas Season Edition 🎄",
      titleColor: 'text-slate-900',
      inputFocus: 'focus:ring-red-500/20 focus:border-red-500'
    };
    if (theme === 'tet') return {
      bg: 'bg-gradient-to-br from-[#7c2d12] via-[#991b1b] to-[#450a0a]',
      card: 'bg-white/95',
      accent: 'bg-gradient-to-br from-red-600 to-amber-500',
      button: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-red-900/20',
      icon: <Coins className="text-yellow-300 w-10 h-10 animate-bounce" />,
      tag: "Lunar New Year 🧧 Team V1",
      titleColor: 'text-red-900',
      inputFocus: 'focus:ring-orange-500/20 focus:border-orange-500'
    };
    return {
      bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
      card: 'bg-white',
      accent: 'bg-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20',
      icon: <ShieldCheck className="text-white w-10 h-10" />,
      tag: "Enterprise Resource Management",
      titleColor: 'text-slate-900',
      inputFocus: 'focus:ring-indigo-500/20 focus:border-indigo-500'
    };
  }, [theme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        employeeCode,
        password,
      });
      if (error) setError(error.message);
      else if (data?.user) {
        localStorage.setItem('sb-session', JSON.stringify(data.session));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${festiveConfig.bg} flex items-center justify-center p-6 transition-all duration-1000 relative overflow-hidden`}>
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="absolute top-8 right-8 flex gap-3 p-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 z-50">
        <button onClick={() => setTheme('default')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'default' ? 'bg-white shadow-lg scale-110 text-indigo-600' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><Sparkles className="w-5 h-5" /></button>
        <button onClick={() => setTheme('tet')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'tet' ? 'bg-white shadow-lg scale-110 text-red-600' : 'text-white/60 hover:text-white hover:bg-white/10'}`}><Gift className="w-5 h-5" /></button>
      </div>

      <div className={`${festiveConfig.card} max-w-md w-full rounded-[3rem] p-10 md:p-14 shadow-2xl relative z-10 animate-zoom-in border border-white`}>
        <div className="text-center mb-12">
          <div className={`mx-auto ${festiveConfig.accent} w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transform hover:rotate-6 transition-transform duration-500`}>
            {festiveConfig.icon}
          </div>
          <h2 className={`text-4xl font-black ${festiveConfig.titleColor} tracking-tight leading-none uppercase italic`}>Manager V</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-slate-400 opacity-80 italic">{festiveConfig.tag}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">Mã nhân viên</label>
            <div className="relative">
              <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                className={`w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-900 outline-none transition-all ${festiveConfig.inputFocus}`}
                placeholder="VD: NV001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-900 outline-none transition-all ${festiveConfig.inputFocus}`}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-[11px] font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${festiveConfig.button} text-white font-black py-5 rounded-3xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest mt-6 shadow-xl border-b-4 border-black/10`}
          >
            {loading ? <LucideLoader2 className="w-5 h-5 animate-spin" /> : <>Bắt đầu ngay <ArrowRight className="w-4 h-4"/></>}
          </button>
        </form>
        
        <div className="mt-14 text-center">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">Infrastructure by Team V1 • 2025</p>
        </div>
      </div>
    </div>
  );
};
