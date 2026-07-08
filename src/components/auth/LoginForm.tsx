
import React, { useState, useMemo, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LucideLoader2, UserCircle, ShieldCheck, Lock, AlertCircle, 
  TreePine, Gift, Sparkles, Coins, ArrowRight, Eye, EyeOff, 
  Palette, Sun, Snowflake, Info
} from 'lucide-react';
import { ThemeContext } from '../../../App';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const festiveConfig = useMemo(() => {
    if (theme === 'noel') return {
      bg: 'bg-[#0f172a]',
      gradient: 'from-blue-900/60 via-slate-950 to-emerald-950',
      card: 'bg-slate-900/80 border-white/10 backdrop-blur-3xl',
      accent: 'bg-gradient-to-br from-red-600 to-rose-700',
      button: 'bg-red-600 hover:bg-red-500 shadow-red-500/20',
      icon: <TreePine className="text-white w-10 h-10" />,
      tag: "Giáng Sinh An Lành 🎄",
      textColor: 'text-white',
      mutedText: 'text-blue-200/50',
      inputBg: 'bg-white/5 border-white/10 text-white',
      inputFocus: 'focus:border-red-500 focus:ring-red-500/20',
      checkColor: 'bg-red-600'
    };
    if (theme === 'tet') return {
      bg: 'bg-[#450a0a]',
      gradient: 'from-red-900 via-orange-950 to-yellow-950',
      card: 'bg-white/95 border-red-100',
      accent: 'bg-gradient-to-br from-red-600 to-amber-500',
      button: 'bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-orange-500/30',
      icon: <Coins className="text-yellow-300 w-10 h-10 animate-bounce" />,
      tag: "Tết Giáp Thìn 🧧 Team V1",
      textColor: 'text-red-950',
      mutedText: 'text-red-400',
      inputBg: 'bg-red-50/50 border-red-100 text-red-950',
      inputFocus: 'focus:border-orange-500 focus:ring-orange-500/20',
      checkColor: 'bg-red-600'
    };
    return {
      bg: 'bg-slate-50',
      gradient: 'from-indigo-100/70 via-sky-50 to-violet-100/70',
      card: 'bg-white/85 border-white/80 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(99,102,241,0.08)]',
      accent: 'bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/50',
      button: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/30 border-b-4 border-indigo-700/30',
      icon: <ShieldCheck className="text-white w-10 h-10" />,
      tag: "Hệ thống Quản lý V1",
      textColor: 'text-slate-800',
      mutedText: 'text-indigo-600/70',
      inputBg: 'bg-slate-50/30 border-slate-200/80 text-slate-800 backdrop-blur-sm',
      inputFocus: 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10',
      checkColor: 'bg-indigo-600'
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
    <div className={`min-h-screen ${festiveConfig.bg} flex items-center justify-center p-4 transition-all duration-1000 relative overflow-hidden`}>
      {/* Dynamic Background Elements */}
      <div className={`absolute inset-0 bg-gradient-to-br ${festiveConfig.gradient}`}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 flex items-center gap-2 p-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 z-50 shadow-2xl">
        <button 
          onClick={() => setTheme('default')} 
          className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'default' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Palette className="w-5 h-5" />
          <span className="absolute bottom-full mb-3 right-0 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">MẶC ĐỊNH</span>
        </button>
        <button 
          onClick={() => setTheme('tet')} 
          className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'tet' ? 'bg-white text-red-600 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Gift className="w-5 h-5" />
          <span className="absolute bottom-full mb-3 right-0 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">TẾT TA</span>
        </button>
        <button 
          onClick={() => setTheme('noel')} 
          className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'noel' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Snowflake className="w-5 h-5" />
          <span className="absolute bottom-full mb-3 right-0 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">GIÁNG SINH</span>
        </button>
      </div>

      <div className={`${festiveConfig.card} max-w-[450px] w-full rounded-[3rem] p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative z-10 animate-zoom-in border border-white/50 hover-lift`}>
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className={`mx-auto ${festiveConfig.accent} w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-all duration-500`}>
            {festiveConfig.icon}
          </div>
          <h2 className={`text-4xl font-black ${festiveConfig.textColor} tracking-tight leading-none uppercase italic mb-2 drop-shadow-sm`}>Manager V</h2>
          <div className="flex items-center justify-center gap-3">
            <span className={`h-[1.5px] w-6 ${theme === 'noel' ? 'bg-white/10' : 'bg-slate-200'}`}></span>
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${festiveConfig.mutedText} italic`}>{festiveConfig.tag}</p>
            <span className={`h-[1.5px] w-6 ${theme === 'noel' ? 'bg-white/10' : 'bg-slate-200'}`}></span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ${festiveConfig.mutedText} ml-2 flex items-center gap-2`}>
              <UserCircle className="w-3 h-3" /> Mã nhân viên
            </label>
            <div className="relative group">
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                className={`w-full px-6 py-4.5 ${festiveConfig.inputBg} rounded-2xl text-sm font-bold outline-none transition-all shadow-sm border ${festiveConfig.inputFocus} placeholder:opacity-30`}
                placeholder="VD: NV001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ${festiveConfig.mutedText} flex items-center gap-2`}>
                <Lock className="w-3 h-3" /> Mật khẩu
              </label>
              <button type="button" className={`text-[9px] font-black uppercase tracking-widest ${festiveConfig.mutedText} hover:opacity-100 transition-opacity`}>Quên?</button>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-6 pr-14 py-4.5 ${festiveConfig.inputBg} rounded-2xl text-sm font-bold outline-none transition-all shadow-sm border ${festiveConfig.inputFocus} placeholder:opacity-30`}
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${theme === 'noel' ? 'text-white/20 hover:text-white' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center px-2 gap-3 group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
            <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${rememberMe ? festiveConfig.checkColor + ' border-transparent' : 'border-slate-300 bg-white'}`}>
              {rememberMe && <ArrowRight className="w-3 h-3 text-white rotate-[-45deg]" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${festiveConfig.mutedText} group-hover:opacity-100 transition-opacity`}>Ghi nhớ đăng nhập</span>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-tight rounded-2xl border border-rose-500/20 flex items-center gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${festiveConfig.button} text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 uppercase text-[11px] tracking-[0.2em] shadow-2xl relative group overflow-hidden border-b-4 border-black/10`}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-45 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
              
              {loading ? (
                <LucideLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>VÀO HỆ THỐNG <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform"/></>
              )}
            </button>
          </div>
        </form>
        
        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-black/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100/50 rounded-full border border-black/5">
            <Info className="w-3 h-3 text-slate-400" />
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Powered by V1 Platform</p>
          </div>
          <p className={`text-[8px] font-black uppercase tracking-[0.5em] ${festiveConfig.mutedText}`}>EST. 2025 • ENTERPRISE</p>
        </div>
      </div>
    </div>
  );
};
